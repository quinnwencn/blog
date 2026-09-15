---
title: "[C++] Thread race condition problem"
date: 2025-11-13 00:00:00
tags:
  - "bug"
categories:
  - "Systems C++"
---

# Overview
I’m testing a thread race condition issue using a TCP server and client. The server accepts client connections and stores each connection session in a vector. I’m trying to remove a session when it ends, but doing so causes the program to crash. The error message is shown below:
```
$ ./build/server       
Client 0 connected
Client 0 disconnected
libc++abi: terminating
[1]    30429 abort      ./build/server
```

# Analysis
Let’s first explain the code. I use a Socket to build a TCP server and then run it.
```Cpp
int main(int argc, char** argv) {
    auto socket = std::make_unique<TCPSocket>();
    TCPServer server(8080, std::make_shared<EchoHandler>());

    if (!server.Start()) {
        return -1;
    }
    server.AcceptLoop();
    server.Stop();

    return 0;
}
```
The server is constructed with an EchoHandler, and Start() makes it listen on the bound socket.
```Cpp
bool TCPServer::Start() {
    if (!socket_->Bind("0.0.0.0", port_)) {
        return false;
    }

    int value = 1;
    socket_->SetOption(SOL_SOCKET, SO_REUSEADDR, value);
    return ::listen(socket_->Fd(), SOMAXCONN) == 0;
}
```
Once the server starts, it begins accepting new connections, which are added to a vector:
```Cpp
}

void TCPServer::AcceptLoop() {
    int clientId = 0;
    while (true) {
        struct sockaddr_in clientAddr{};
        socklen_t addrLen = sizeof(clientAddr);
        int clientFd = ::accept(socket_->Fd(), (struct sockaddr*)&clientAddr, &addrLen);
        if (clientFd < 0) {
            continue;
        }
        
        auto session = std::make_shared<Session>(clientFd, clientId++, handler_, [this](int fd) { this->RemoveSession(fd); });
        sessions_.push_back(session);
        session->Start();
    }
}
```
In AcceptLoop, the server continuously accepts new client connections. For each connection, it creates a Session, adds it to the sessions_ vector, and starts it immediately.
So far, everything works fine. But note that we attach a **lambda callback** to each session — this callback removes the session from the server once it ends.

Here’s the Session constructor:
```Cpp
Session(int connectedFd, int clientId, std::shared_ptr<IProtocolHandler> handler, CloseCallback cb) : 
        ISession(cb),
        connectedFd_(connectedFd), 
        clientId_(clientId), 
        handler_(handler),
        running_(false) {}
```
When a session starts, it spawns a new thread that runs until the connection closes:
```CPP
void Session::Start() {
    handler_->OnConnect(clientId_);
    running_ = true;
    runThread_ = std::thread(&Session::Run, this);
}

void Session::Run() {
    std::array<char, 1024> buffer {};
    while (running_.load()) {
        ssize_t bytesRead = ::read(connectedFd_, buffer.data(), buffer.size());
        if (bytesRead <= 0) {
            break;
        }
        buffer[bytesRead] = '\0';
        handler_->OnMessage(clientId_, std::string_view(buffer.data(), bytesRead));
    }
    callback_(Fd());
}
```

The problem occurs when the loop breaks and the callback attempts to remove the current session from the server’s vector — this triggers the session’s destruction while its thread is still running, causing a crash.

# How to fix it.
There are two main approaches to solve this issue.
## Deconstruct the session in a new thread
The crash happens because the session is destroyed in one thread while it’s still running in another.
To fix this, we can ensure that the session remains alive until the thread truly ends.
### Step 1: Session inherits from enable_shared_from_this
```Cpp
class Session : public ISession, public std::enable_shared_from_this<Session> {
public:
    Session(int connectedFd, int clientId, std::shared_ptr<IProtocolHandler> handler, CloseCallback cb) : 
        ISession(cb),
        connectedFd_(connectedFd), 
        clientId_(clientId), 
        handler_(handler),
        running_(false) {}
    ~Session() override;
 // other code
```
This will make the Session a shared object,  when the deconstruction function is called, it will calculate the shared times, unless it decreases to 0, it won't really call ~Session.

### Step 2: Create a shared self and remove itself in the main thread:
```Cpp
void Session::Run() {
    std::array<char, 1024> buffer {};
    while (running_.load()) {
        ssize_t bytesRead = ::read(connectedFd_, buffer.data(), buffer.size());
        if (bytesRead <= 0) {
            break;
        }
        handler_->OnMessage(clientId_, std::string_view(buffer.data(), bytesRead));
    }

    running_ = false;

    // Protect this from being deleted
    auto self = shared_from_this();
    std::thread([cb = closeCallback_, fd = connectedFd_, self]() {
        cb(fd);  // 让 server 删除 session
    }).detach();
}
```

## Using Epoll or Poll + Nonblocking IO
In the Run funciton of TCP server, change it to nonblock mode and remove a session when it ends.

[source issue](https://github.com/quinnwencn/blog/issues/127)
