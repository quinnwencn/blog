---
title: "[Crypto] Warmming up with MACsec"
date: 2024-12-17 00:00:00
tags:
  - "Crypto"
  - "MACsec"
categories:
  - "Security Crypto"
---

# Overview
MACsec(Media Access Control Security) is a layer 2 protocol, standardized in 2006 by IEEE (standard IEEE 802.1AE-2006),  that relies on AES-128-GCM to protect integrity and confidentiality over Ethernet. As such, MACsec can protect not only IP data but also ARP and other protocols based on layer 2 (according to the OSI layer model).
A companion protocol, IEEE 8.2.1X-2010(MACsec Key Agreement, MKA) is standized in 2010 to provide key exchange and allow mutual authentication of nodes involving MACsec connectivity association. MACsec can be used in combination with other security protocols like IPSec (Internet Protocol Security), TLS (Transport Layer Security), to provide end-to-end network security.

![image](https://github.com/user-attachments/assets/32417c28-6938-4207-834b-b21443380b78)

# How it works
MACsec uses a combination of data integrity checks and encryption to secure traffic traversing the link:
* *Data integrity*: MACsec appends an (8-16)-byte header (SecTAG) and a 16-byte tail (ICV, Integrity Check Value) to all Ethernet frames traversing the MACsec-secured link. The header and tail are checked by the receiving interface to ensure that the data was not compromised while traversing the link. If the data integrity check detects anything irregular about the traffic, the traffic is dropped.
* *Encryption*: Encryption ensures that the data in the Ethernet frame cannot be viewed by anybody monitoring traffic on the link. MACsec encryption is optional and user-configurable. You can enable MACsec to ensure the data integrity checks are performed while still sending unencrypted data “in the clear” over the MACsec-secured link, if desired. 
> Note: When MACsec is enabled on a logical interface, VLAN tags are not encrypted. All the VLAN tags configured on the logical interface enabled for MACsec are sent in clear text.

![image](https://github.com/user-attachments/assets/a3559dfa-da50-4f42-830b-527b29089008)
or 
![image](https://github.com/user-attachments/assets/17c7ce0a-80f4-47c5-8149-10984db11bfd)
or
![image](https://github.com/user-attachments/assets/7becca79-794e-4659-8e0a-862e2a42cde2)


When considering a point-to-point communication scenario, the link is secured after matching secure keys are exchanged and verified between the two communication nodes at the peer end of the link. The key can be configured manually or generated dynamically. 

![image](https://github.com/user-attachments/assets/356d7caa-3b37-4c7f-9e16-0bbacd1e7ea5)


MACsec is configured in connectivity associations. In the above scenario, both nodes are considered as a connectivity association. A connectivity association as a set of MACsec attributes that interfaces use to create two channels, one for inbound traffic and the other for outbound traffic. The secure channels are responsible for transmitting and receiving data on the MACsec secure link. Secure channels are created automatically without any user-configurable data, and they must be assigned to a MACsec-capable interface on each side of the point2point Ethernet link.  But as we know, communication with multiple nodes is common in network communication, MACsec also supports multiple Ethernet links, but in this case, we must configure MACsec individually on each link.

## MACsec Security Modes
MACsec can be configured into one of the following modes:
* Static CAK(Connectivity Association Key) mode
* Dynamic CAK mode

### Static CAK mode
Wen Static CAK mode is enabled, two security keys are used to secure the link:
* CAK: Connectivity Association Key, which is used to secure the control plane traffic.
* SAK: Secure Association Key, generated dynamically, which is used to secure the data plane traffic.
Both keys are exchanged regularly between both nodes on the peer of the link. We must provide a pre-shared key in static CAK mode, which includes a connectivity association key name(CKN) and its own CAK. The CKN and CAK are configured by the user and must match the peer node's CKN and CAK.

Once matching pre-shared keys are successfully exchanged, the MACsec Key Agreement(MKA) protocol is enabled, which will be responsible for maintaining MACsec on the link. MKA also decides which switch on the link becomes the key server of the link. The key server will generate an SAK and share it with the switch at the peer node. The SAK will be generated randomly and periodically during the MACsec connection.

### Dynamic CAK mode
Unlike static CAK mode, CAK and SAK keys are generated automatically and randomly in dynamic CAK mode. There must be a RADIUS server when dynamic CAK mode is enabled.. The peer nodes of the MACsec link receive key attributes from the RADIUS server during authentication and use these attributes to generate the CAK and SAK. Then they exchange the keys to create a MACsec-secured connection like static CAK mode. During authentication of dynamic CAK mode, certificates must be used to validate authentication, using Extensible Authentication Protocol-Transport Layer Security (EAP-TLS).


## Integrity Protection
In the above picture, there is an ICV in every frame. The ICV is calculated using the cryptographic digest function with the data and the SAK. This makes it impossible to tamper with the data without knowing the key. To prevent the link from dropping, replaying, and delaying the attack, the receiver can use the packet number (PN) to check. PN is 32 bits long and unique to the specific SA(Secure Association) and SAK. MACsec transmits each frame in an SA with a PN that increases with each frame transmitted.

## Communication flow
![image](https://github.com/user-attachments/assets/14336ef4-468f-4e31-8572-475c5b81484e)
As illustrated above, the communication flow of MACsec entities consists of three phases:
1. Authentication of participants
2. Session negotiation
3. Secure communication

### Authentication of participants
Before two entities start MACsec communication, CAK must be provisioned, either by static provisioning(pre-shared) or dynamic generation. During the first phase of the MACsec Key Agreement(MKA) sequence, the MKA entity identifies other participants belonging to its configured CA.
The participants of the MKA communication will identify and authenticate each other based on the CKN and ICV of the MKPDUs exchanged. Once a participant can successfully identify and authenticate another participant belonging to the same CA, the member identifier of the other participant is included in its transmitted “Potential Peer List”. If a participant recognizes another one and it is listed in the other “Potential peer List”, it will mark it as a Live participant. The Member Identifier of the other participant will be included in the transmitted “Live Peer List”.

### Session negotiation
In AUTOSAR's [Requirements on MACsec](https://www.autosar.org/fileadmin/standards/R22-11/FO/AUTOSAR_RS_MACsec.pdf)， dynamic election of the Key Server member is not supported, so we will assume that each participant will currently configure its role in the communication in advance.
The participants can share the supported cipher suites by means of the “MACsec Cipher Suites Announcement”. The participant with the Key Server role will select a cipher suite and generate and distribute a Secure Association Key accordingly.
Both participants shall communicate the readiness to transmit and receive MACsec protected PDUs with the “MACsec SAK Use” parameter set.
During the Secure Channel life time, it is possible to distribute new SAKs (and therefore create a new SA) without a communication interruption. The participants can also detect if the communication partner is alive. In case a cipher suite with Extended Packet Number (XPN) is selected, additional parameter sets are exchanged during the Secure Channel life time to keep the channel information up-to-date.

Roles in MACsec:
* Participant: The personification of a single KaY’s participation in a given MKA instance. It transmits and receives MKPDUs protected by keys derived from a single given CAK and identified by a Connectivity Association Key Name (CKN).
* Key Server: Authenticated participant which generates and distributes the Secure Association Key to use in a Secure Channel. This participant decides the cipher suites to use.
* Peer: Authenticated participant which does not possess the Key Server role.

A key server is selected between the routers, based on the configured key server priority. Lower the priority value, higher the preference for the router to become the key server. If no value is configured for a router, a default value of 16 will be assigned, making it less likely to be selected as a key server.

### Secure communication
Secure communication can start based on the parameters exchanged in the previous phases after the identification, mutual authentication, distribution of keys, and installation of keys.

## Keys used in MACsec
* Secure Connectivity Association Key (CAK): Secret key possessed by members of a given CA. The CAK is identified by its respective secure Connectivity Association Key Name (CKN).
* Integrity Check Value Key (ICK): Key derived from the respective CAK and used to transmit/validate Integrity-protected MKPDUs.
* Key Encrypting Key (KEK): Key derived from the respective CAK and used to encrypt/decrypt a Secure Association Key (SAK).
* Secure Association Key (SAK): Key used by the MACsec Entity (SecY) to integrity protect/validate and/or encrypt/decrypt MPDUs belonging to a specific Secure Association. The SAK is generated by one MKA participant (Key Server) and distributed during the MKA sequence.

# MACsec on Linux
## Enable MACsec in kernel
![image](https://github.com/user-attachments/assets/0d110404-dfe5-4f53-b964-4806f05052f2)

Enable it via menuconfig and rebuild the kernel, boot the system to check if MACsec is enabled as follow:
![image](https://github.com/user-attachments/assets/a44c7d94-295c-4262-a392-7f2e665e43ea)

## Install dependencies
```bash
git clone git://git.kernel.org/pub/scm/linux/kernel/git/shemminger/iproute2.git
cd iproute2/
./configure
make
make install
modprobe macsec
```

## Configure two PC to support MACsec following below steps:
* Create MACsec device on the physical link over the which traffic will be received and sent
* Configure a secure association on the MACsec device
* Configure a receive channel(Use the peer MAC address as parameter)
* Configure a receive association(Use the peer MAC address as parameter)

 First we need to know the MAC addresses of the two hosts between which MACsec will be configured. 
PC1:
```bash
$ ifconfig enp3s0
enp3s0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 10.10.65.132  netmask 255.255.255.0  broadcast 10.10.65.255
        inet6 fe80::2a1e:eaf0:5399:36c3  prefixlen 64  scopeid 0x20<link>
        ether 6c:02:e0:3f:48:73  txqueuelen 1000  (Ethernet)
        RX packets 12337823  bytes 4952665014 (4.9 GB)
        RX errors 0  dropped 99836  overruns 0  frame 0
        TX packets 10911342  bytes 1488844020 (1.4 GB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0
```
PC2:
```bash
$ ifconfig enp10s0
enp10s0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 10.10.65.160  netmask 255.255.255.0  broadcast 10.10.65.255
        inet6 fe80::4e0e:9135:fe5a:3146  prefixlen 64  scopeid 0x20<link>
        ether fc:34:97:3e:39:db  txqueuelen 1000  (Ethernet)
        RX packets 51250647  bytes 20803829324 (20.8 GB)
        RX errors 0  dropped 2993  overruns 0  frame 0
        TX packets 43970549  bytes 8792735611 (8.7 GB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

```

1. Create MACsec device on enp3s0 interface (with root or sudo permission)
```bash
ip link add link enp3s0 macsec0 type macsec
```
5. Configure the transmit secure association, the packet number used as the start ID for the packets sent through this SA and the key
```bash
ip macsec add macsec0 tx sa 0 on 1 on key 01 12345678901234567890123456789012
```
6. Configure the receive channel and receive association based on the peer MAC address, the port number, the first packet expected and the key
```bash
ip macsec add macsec0 rx address fc:34:97:3e:39:db port 1
ip macsec add macsec0 rx address fc:34:97:3e:39:db port 1 sa 0 on 1 on key 02 09876543210987654321098765432109
```
7. Bring up the interface and configure an IP address on it
```bash
ip link set dev macsec0 up
ifconfig macsec0 10.10.12.1/24
```

Redo this on another PC, or use the scripts bellow:
* Script1:
```bash
#!/bin/bash
set -e

if [ $# -ne 2 ]; then
	echo "./macsec.sh dev mac_address_of_peer"
	exit 1
fi

dev=$1
addr=$2

ip link add link $dev macsec0 type macsec
ip macsec add macsec0 tx sa 0 pn 1 on key 01 12345678901234567890123456789012
ip macsec add macsec0 rx address $addr port 1
ip macsec add macsec0 rx address $addr port 1 sa 0 pn 1 on key 02 09876543210987654321098765432109
ip link set dev macsec0 up
ifconfig macsec0 10.10.12.1/24
```

* Script2
```bash
#!/bin/bash
set -e

if [ $# -ne 2 ]; then
	echo "./macsec.sh dev mac_address_of_peer"
	exit 1
fi

dev=$1
addr=$2

ip link add link $dev macsec0 type macsec
ip macsec add macsec0 tx sa 0 pn 1 on key 02 09876543210987654321098765432109 
ip macsec add macsec0 rx address $addr port 1
ip macsec add macsec0 rx address $addr port 1 sa 0 pn 1 on key 01 12345678901234567890123456789012
ip link set dev macsec0 up
ifconfig macsec0 10.10.12.2/24
```
Then ping and verify it:

![image](https://github.com/user-attachments/assets/b6139af4-87de-44b3-b5db-1e33a183df99)

> [!NOTE]  
> Hardware support for MACsec is available. MACsec-aware hardware, such as PHYs or specific controllers and routers, can enhance the speed of encryption and AES-GCM calculations, resulting in improved performance.


# Reference
https://nextheader.net/2016/10/14/macsec-on-linux/
https://developers.redhat.com/blog/2016/10/14/macsec-a-different-solution-to-encrypt-network-traffic#configuration_example
https://www.comcores.com/what-is-macsec/

More detail of AUTOSAR explanation of MACsec and MKA protocols implementation can refer to https://www.autosar.org/fileadmin/standards/R23-11/AP/AUTOSAR_AP_EXP_MACsec.pdf

[source issue](https://github.com/quinnwencn/blog/issues/85)
