---
title: "[HSM] Install softhsm on ubuntu"
date: 2024-06-24 00:00:00
tags:
  - "HSM"
categories:
  - "Security Crypto"
---

<li>Download source code from <a href="https://github.com/opendnssec/SoftHSMv2/tags">softHSM release page</a>
</li>
<p>``<code>bash
</p>
<p>wget https://github.com/opendnssec/SoftHSMv2/archive/refs/tags/2.6.1.tar.gz
</p>
<p>tar -xvf 2.6.1.tar.gz
</p>
</code>`<code>
<li> Compile the source code
</li>
</code>`<code>bash
<p>cd SoftHSMv2-2.6.1
</p>
<p>./autogen.sh
</p>
<p>./configure --prefix=/opt/softhsm
</p>
<p>make -j4
</p>
<p>sudo make install
</p>
</code>`<code>
<li>Add softhsm binary to PATH
</li>
</code>`<code>bash
<p>vim ~/.bashrc
</p>
<h1>add following line to ~/.bashrc
</h1>
<p>export PATH=$PATH:/opt/softhsm/bin
</p>
</code>`<code>
<li>Now softhsm2-util is available on your machine:
</li>
<img src="https://github.com/user-attachments/assets/eb58e711-ce81-4312-b64b-b5c5589ad30c" alt="image" style="max-width:100%;">
<li>Install opensc
</li>
</code>`<code>bash
<p>sudo apt install opensc
</p>
</code>``
