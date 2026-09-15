---
title: "[HSM] Generate key using softhsm"
date: 2024-09-28 00:00:00
tags:
  - "HSM"
categories:
  - "Systems C++"
---

<p>To generate a key in HSM using softhsm, the HSM must be initialized first as follows:
</p>
<p>``<code>bash
</p>
<p>softhsm2-util --init-token --slot 0 --label kms
</p>
</code>``
<p>During the initialization, you have to enter a password for Secure Officer and a password for a normal user, as follows:
</p>
<img src="https://github.com/user-attachments/assets/e5d4048d-7615-42af-b1b2-e946a9ebdbcf" alt="image" style="max-width:100%;">
<p>After the HSM is initialized, we can see that slot 0 is initialized and labeled as kms:
</p>
<img src="https://github.com/user-attachments/assets/3941f94b-6efc-4632-94f4-32a45d29fb1e" alt="image" style="max-width:100%;">
