---
title: "[nodejs + so] nodejs调用so库函数"
date: 2024-06-12 00:00:00
tags:
  - "nodejs"
categories:
  - "Legacy"
---

# Warming up with node js


1. install nvm

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

restart the terminal and verify nvm is already installed

```bash
nvm -v
```


2. install nodejs via nvm

```bash
# find the latest long term support version
nvm ls-remote
# pick v18.15.0 as our nodejs version
nvm install v18.15.0 
# test if the installation succeed
node -v
# expect output: v18.15.0
npm -v
# expect output: 9.5.0
```


3. nodejs hello world project

```bash
echo 'console.log("Hello world")' > helloworld.js
node helloworld.js
# expect output: Hello world
```


# Call a C function in a so library from nodejs

First, we prepare a so to be called by nodejs:


1. Cpp file: test.cc

```cpp
#include <iostream>
#include <string>
 
using namespace std;
 
extern "C" {
int add(int lhs, int rhs) {
    cout << lhs << " + " << rhs << " = " << lhs + rhs << endl;
    return lhs + rhs;
}
 
} 
```


2. Makefile

```bash
all:
    g++ -fPIC -shared -o libtest.so test.cc
 
clean:
    rm libtest.so
```


3. install ffi-napi and ref-napi on your machine

```bash
npm install ref-napi
npm install ffi-napi
```


4. helloworld.js

```cpp
const ffi = require('ffi-napi');
const ref = require('ref-napi');

const int = ref.types.int;

const libtest = ffi.Library('./libtest', {'add': [int, [int, int]]});

const result = libtest.add(1, 2);
console.log("Result of 1 + 2:", result);
```

execute `node helloworld.js`:

![image](https://github.com/robertwenhk/blog/assets/143626366/fabf8a61-c824-4607-9d4d-1827012a7c27)


# Call auth service functions from nodes

nodejs can not access functions and class from C++ directly, especially `unique_ptr`, `shared_ptr` , etc. These new features of C++ are not visible to nodejs. So we cannot call any C++ class with this functionality from nodejs. But luckily, we can wrap the auth_service library into a C API, which is easy to use with Nodejs.

I add cauth.h and cauth.cpp， which is the wrapper files of auth service library. As we can see, the auth_service functions are wrapped into C functions as bellow:

```cpp
typedef struct {
    char rootCertId[ID_SIZE];
    char certId[ID_SIZE];
    char keyId[ID_SIZE];
    char storagePath[PATH_SIZE];
    char logPath[PATH_SIZE];
    uint8_t maxLogFiles;
} InitStruct;

void initSoCAuthService(const InitStruct* initParam);
void provision(uint16_t port);
void destroyProvisionThread();

bool isValidToken(const char* token);
```

nodejs supports structs and can call these functions easily, let's see the example:

```javascript
const ffi = require('ffi-napi');
const ref = require('ref-napi');
const Struct = require('ref-struct-napi');

const charPtr = ref.types.CString;
const uint16 = ref.types.uint16; 
const uint8 = ref.types.uint8;
const AuthInitStruct = Struct({
	rootCertId: charPtr,
	certId: charPtr,
	keyId: charPtr,
	storagePath: charPtr,
	logPath: charPtr,
	maxLogFiles: uint8,	
});

const InitStructPtr = ref.refType(AuthInitStruct);

const libauth = ffi.Library("./libauth", {
	'initSoCAuthService': ['void', [InitStructPtr]],
	'provision': ['void', [uint16]],
	'destroyProvisionThread': ['void', ['void']],
	'isValidToken': [ref.types.boolean, [charPtr]]
});

async function main() {
	console.log("Main start");
	const initData = new AuthInitStruct();
	initData.rootCertId = "Test_Root_Cert_Id";
	initData.certId = "Test_Cert_Id";
	initData.keyId = "Test_Key_Id";
	initData.storagePath = "/tmp/nodejs";
	initData.logPath = "/tmp/nodejs";
	initData.maxLogFiles = 3;
	libauth.initSoCAuthService(initData.ref());
    libauth.provision(5555);
    // do the authorization jobs here
    // recv the token from aws server
    // token = recvFromAws();
    // if (libauth.isValidToken(token)) {
    //     do_your_work_here();
    // }
    
    
    libauth.destroyProvisionThread();
}

main().catch(err => console.error(err));
```

In order to support Struct in nodejs, we must install ref-struct-napi in the project:

```javascript
npm install ref-struct-napi
```

But now an error occurs indicating that I don't have libzmq.so on my machine:

```javascript
home/quanwen/work/node_auth/node_modules/ffi-napi/lib/dynamic_library.js:75
    throw new Error('Dynamic Linking Error: ' + err);
    ^

Error: Dynamic Linking Error: ./libauth.so: undefined symbol: zmq_strerror
    at new DynamicLibrary (/home/quanwen/work/node_auth/node_modules/ffi-napi/lib/dynamic_library.js:75:11)
    at Object.Library (/home/quanwen/work/node_auth/node_modules/ffi-napi/lib/library.js:47:10)
    at Object.<anonymous> (/home/quanwen/work/node_auth/auth.js:19:21)
    at Module._compile (node:internal/modules/cjs/loader:1254:14)
    at Module._extensions..js (node:internal/modules/cjs/loader:1308:10)
    at Module.load (node:internal/modules/cjs/loader:1117:32)
    at Module._load (node:internal/modules/cjs/loader:958:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:81:12)
    at node:internal/main/run_main_module:23:47

Node.js v18.15.0
```
It turns out that nodejs doesn’t support Struct, thought I install ref-struct-napiin this project. How did I find out? I delete other functions in the library and copy the previous libtest.so in the current project. The scripts still doesn’t work. So I delete all other codes and find out that this line is the reason: `const Struct = require('ref-struct-napi`)`.
So now the code below works:
```nodejs
const ffi = require('ffi-napi');
const ref = require('ref-napi');

const charPtr = ref.types.CString;
const uint16 = ref.types.uint16; 
const uint8 = ref.types.uint8;
const bool = ref.types.bool;
const int = ref.types.int;

const so = "/home/quanwen/work/onboard/tcu/xtaxi/build/src/libauth.so";

const libauth = ffi.Library(so, {
	'initSoCAuthService': ['void', [charPtr, charPtr, charPtr, charPtr, charPtr, uint8]],
	'provision': ['void', [uint16]],
	'destroyProvisionThread': ['void', []],
	'isValidToken': [bool, [charPtr]], 
});

function sleep(delay) {
	for (var t = Date.now(); Date.now() - t <= delay;);
}

async function main() {
	console.log("Main start");
	const rootCertId = "Test_Root_Cert_Id";
	const certId = "Test_Cert_Id";
	const keyId = "Test_Key_Id";
	const storagePath = "/tmp/nodejs";
	const logPath = "/tmp/nodejs";
	const maxLogFiles = 3;
	libauth.initSoCAuthService(rootCertId, certId, keyId, storagePath, logPath, maxLogFiles);
	libauth.provision(5556);

	while (true) {
		sleep(6000);
	}
}

main().catch(err => console.error(err));
```
I start a process via provision, which will create a zmq channel listening to port 5556. And then I do nothing but wait for 6000 seconds. I can checkout on my machine that the thread works by executing commands:
```
sudo netstat -ntulp | grep 5556
tcp        0      0 0.0.0.0:5556            0.0.0.0:*               LISTEN      689060/node    
```

[source issue](https://github.com/quinnwencn/blog/issues/41)
