# FTP Server Setup Documentation

This document outlines the steps taken to set up an FTP server with vsftpd on a Debian-based system.

## Initial Setup

### 1. Install vsftpd

```bash
apt-get update
apt-get install -y vsftpd
```

### 2. Create FTP User

```bash
useradd -m -d /home/qurc/wordpress_files -s /bin/bash qurc_ftp
echo "qurc_ftp:<your_secure_password>" | chpasswd
```

### 3. Set Permissions

```bash
mkdir -p /home/qurc/wordpress_files
chown qurc_ftp:qurc_ftp /home/qurc/wordpress_files
chmod 755 /home/qurc/wordpress_files
```

### 4. Configure vsftpd

Backup the original configuration:
```bash
cp /etc/vsftpd.conf /etc/vsftpd.conf.bak
```

Create a new configuration with these settings:
```bash
# Basic FTP settings
listen=YES
listen_ipv6=NO
anonymous_enable=NO
local_enable=YES
write_enable=YES
local_umask=022
dirmessage_enable=YES
use_localtime=YES
xferlog_enable=YES
connect_from_port_20=YES


# User restriction settings
chroot_local_user=YES
allow_writeable_chroot=YES
local_root=/home/qurc/wordpress_files

# Authentication settings
pam_service_name=vsftpd


# Passive mode settings
pasv_enable=YES
pasv_min_port=40000
pasv_max_port=40100
pasv_address=<your_server_ip>

# Security settings
secure_chroot_dir=/var/run/vsftpd/empty
```

### 5. Enable Firewall Rules

```bash
ufw allow 21/tcp
ufw allow 40000:40100/tcp
```

### 6. Start and Enable Service

```bash
systemctl restart vsftpd
systemctl enable vsftpd
```

## Administration Guide

### Add New User

```bash
# Create a new user
useradd -m -d /home/qurc/wordpress_files/user2 -s /bin/bash user2
# Set password
echo "user2:password" | chpasswd
# Set permissions
chown user2:user2 /home/qurc/wordpress_files/user2
chmod 755 /home/qurc/wordpress_files/user2
```

### Remove User

```bash
# Delete the user
userdel -r username
```

### Disable User (Without Deleting)

```bash
# Lock the user account
usermod -L username
# Alternative: Change shell to nologin
usermod -s /sbin/nologin username
```

### Enable User

```bash
# Unlock the user account
usermod -U username
# Change shell back to bash
usermod -s /bin/bash username
```

### Change User Password

```bash
passwd username
# Or
echo "username:new_password" | chpasswd
```

### Change User Home Directory

```bash
usermod -d /new/home/directory username
```

### Restart FTP Service

```bash
systemctl restart vsftpd
```

### Check Service Status

```bash
systemctl status vsftpd
```

### View Logs

```bash
tail -f /var/log/vsftpd.log
```

## Uninstallation

To uninstall the FTP server:

```bash
# Stop and disable the service
systemctl stop vsftpd
systemctl disable vsftpd

# Remove the package
apt-get remove --purge vsftpd

# Remove configuration files
rm -rf /etc/vsftpd*

# Close firewall ports
ufw delete allow 21/tcp
ufw delete allow 40000:40100/tcp

# Optionally remove the FTP user
userdel -r qurc_ftp
```

## Troubleshooting

### Connection Issues

If experiencing connection issues:

1. Check if the service is running:
   ```bash
   systemctl status vsftpd
   ```

2. Check if the ports are open:
   ```bash
   netstat -tulpn | grep vsftpd
   ```

3. Check firewall settings:
   ```bash
   ufw status
   ```

4. Test passive mode configuration:
   ```bash
   cat /etc/vsftpd.conf | grep pasv
   ```

### Permission Issues

If experiencing permission issues:

1. Check directory ownership:
   ```bash
   ls -la /home/qurc/wordpress_files
   ```

2. Check SELinux context (if applicable):
   ```bash
   ls -Z /home/qurc/wordpress_files
   ```

3. Set correct permissions:
   ```bash
   chown -R username:username /path/to/directory
   chmod 755 /path/to/directory
   ```

## Connection Information

- Server: `<your_server_ip>`
- Port: 21
- Username: qurc_ftp
- Password: `<your_secure_password>`
- Home Directory: /home/qurc/wordpress_files
