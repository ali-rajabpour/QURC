# WordPress SSL Configuration Guide

## Issue
WordPress container with SSL certificates properly mounted but HTTPS access not working (only HTTP accessible).

## Solution Steps

1. **Enable the SSL Module in Apache**
   ```bash
   docker exec QUR Coin_Wordpress a2enmod ssl
   ```

2. **Enable the SSL Site Configuration**
   ```bash
   docker exec QUR Coin_Wordpress a2ensite default-ssl
   ```

3. **Restart Apache to Apply Changes**
   ```bash
   docker exec QUR Coin_Wordpress service apache2 restart
   ```

4. **Verify Configuration**
   ```bash
   docker exec QUR Coin_Wordpress apache2ctl -S
   ```
   This should show both HTTP (*:80) and HTTPS (*:443) virtual hosts enabled.

## WordPress Permissions Fix

If you encounter permission errors in WordPress admin (such as theme customization or file upload errors):

```bash
docker exec -it QUR Coin_Wordpress bash -c "find /var/www/html -type d -exec chmod 755 {} \; && find /var/www/html -type f -exec chmod 644 {} \; && chown -R www-data:www-data /var/www/html"
```

This single command sets proper WordPress permissions:
- Sets 755 permissions for all directories
- Sets 644 permissions for all files
- Sets ownership to www-data (the user WordPress runs as)

## Notes
- Make sure your certificate files are correctly mounted:
  - Certificates in `/etc/ssl/certs/`
  - Private keys in `/etc/ssl/private/`
  - SSL configuration in Apache's sites-available directory

## Docker Compose Configuration
Ensure your docker-compose.yml includes proper volume mappings:
```yaml
volumes:
  - ./certificates/certs:/etc/ssl/certs:ro
  - ./certificates/private:/etc/ssl/private:ro
  - ./certificates/default-ssl.conf:/etc/apache2/sites-available/default-ssl.conf:ro
```

docker exec QUR Coin_Wordpress a2enmod headers
docker exec QUR Coin_Wordpress a2enmod ssl
docker exec QUR Coin_Wordpress a2enmod rewrite


# Verify SSL module is enabled
docker exec QUR Coin_Wordpress apache2ctl -M | grep ssl

# Check if the SSL sites are enabled
docker exec QUR Coin_Wordpress ls -la /etc/apache2/sites-enabled/

# Enable SSL module if not already enabled
docker exec QUR Coin_Wordpress a2enmod ssl

# Enable SSL site configuration
docker exec QUR Coin_Wordpress a2ensite default-ssl
