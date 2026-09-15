---
title: "[Linux] Using systemd to manage tasks"
date: 2025-11-04 00:00:00
tags:
  - "Linux"
categories:
  - "Embedded Linux"
---

`systemd` is the initialization system for Linux, which is responsible for:
* Starting the system and managing all background services(daemon)
* Controlling the startup order and dependencies of services
* Providing a unified command-line tool `systemctl`
* Managing logs, resources limited, automatic restarts, and more
Almost all modern Linux distributions, including embedded systems, use systemd.

# Learning by example
We have two services, A and B. A is a service that initializes the system and then exits. B will persist in the system, but it depends on service A. And A depends on the network service.

Here is how service A is configured: a.service
```
[Unit]
Description=Prepare XXX Enviroment
After=network.target

[Service]
Type=oneshot
ExecStart=/usr/bin/A
RemainAfterExit=yes
TimeoutStartSec=60s
User=root


[Install]
WantedBy=multi-user.target
```

And B: b.service
```
[Unit]
Description=B system
After=a.service

[Service]
Type=simple
Environment="LD_LIBRARY_PATH=/usr/local/lib:$LD_LIBRARY_PATH"
ExecStart=/usr/local/bin/fota -c /userdata/b/us.toml
Restart=on-failure
RestartSec=3
User=root
WorkingDirectory=/userdata/b
StandardOutput=journal
StandardError=journal
TimeoutStopSec=3s

[Install]
WantedBy=multi-user.target
```

Above is the systemd service file. A systemd service file describes how a process (or job) should start, stop, restart, and behave under Linux’s systemd init system.
Service files are usually located in:
```
/etc/systemd/system/        # User or custom services (preferred for local changes)
/usr/lib/systemd/system/    # Distribution-provided services
/lib/systemd/system/        # Sometimes used by distros (like Debian-based)
```

##  Structure of a service file
A typical `.service` file has three main sections:
* [Unit]: Defines metadata and dependencies -- When and in what order the service should start.
* [Service]: Defines how the service runs -- What command to execute, how to supervise it, restart policies, etc.
* [Install]: Defines how the service is enabled or linked to a target

## Keywords in each section
### Unit
* Description: Short human-readable description of the service
* After: Start after the listed units have started
* Before: Start before the listed units
* Requires: Hard dependency: these units must start for this one to start
* Wants: Soft dependency: try to start these, but not required
* Conflicts: Defines mutual exclusivity with other units
* ConditionPathExists: Run this unit only if a path exists
* Documentation: Optional reference to documentation or man pages

### Service
* Type: Defines how systemd interprets service into startup, common types:
   * simple: Default, the process runs in the foreground
   * forking: Daemonizes itself(forks into background)
   * oneshot: Runs a short-lived job (script) and exits.
   * notify: Application notifies systemd when ready
   * idle: Runs when system is idle
* ExecStart: The command (and argument) to execute when starting.
* ExecStop: Command to run when stopping the service
* ExecReload: Command to reload configuration
* User/Group: User and group under which to run the service
* WorkingDirectory: Set current working directory
* Environment: Define environment variables
* EnvironmentFile: Load env vars form a file
* Restart: Define restart policy
* RestartSec: Delay before restarting (in seconds)
* TimeoutStartSec: How long to wait for start before failing
* RemainAfterExit: For oneshot units -- remain "active" after script exits.
* StandardOutput/StandardError: Control where logs go (journal, syslog, file, etc)
* TimeoutStopSec: Defines how long systemd will wait for the service to stop gracefully after it receives a stop signal(usually SIGTERM), before forcibly killing the process with SIGKILL.

### Install
* wantedBy: Links this service to a target (e.g. multi-user.target)
* RequiredBy: Stronger version of WantedBy
* Also: Enable or disable additional units together with this one
* Alias: Additional names for the same service

[source issue](https://github.com/quinnwencn/blog/issues/124)
