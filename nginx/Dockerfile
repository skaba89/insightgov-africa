# =============================================================================
# InsightGov Africa - Nginx Dockerfile
# =============================================================================
# Image Nginx custom pour InsightGov Africa
# - Configuration intégrée
# - SSL support
# - Health checks
# =============================================================================

FROM nginx:alpine

# Labels pour l'image
LABEL maintainer="InsightGov Africa Team"
LABEL version="1.0"
LABEL description="Nginx reverse proxy for InsightGov Africa"

# =============================================================================
# INSTALLATIONS
# =============================================================================

# Installer les outils nécessaires
RUN apk add --no-cache \
    curl \
    tzdata \
    && rm -rf /var/cache/apk/*

# =============================================================================
# CONFIGURATION
# =============================================================================

# Créer les répertoires nécessaires
RUN mkdir -p /var/cache/nginx/static \
             /var/cache/nginx/api \
             /var/log/nginx \
             /etc/nginx/ssl \
             /var/www/html

# Copier la configuration Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copier les pages d'erreur personnalisées
COPY html/ /var/www/html/

# =============================================================================
# SSL PLACEHOLDER
# =============================================================================

# Générer un certificat auto-signé pour le démarrage initial
# REMARQUE: En production, utiliser des certificats valides (Let's Encrypt)
RUN apk add --no-cache openssl && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/key.pem \
    -out /etc/nginx/ssl/cert.pem \
    -subj "/C=GN/ST=Conakry/L=Conakry/O=InsightGov Africa/OU=IT/CN=localhost" && \
    chmod 600 /etc/nginx/ssl/key.pem && \
    chmod 644 /etc/nginx/ssl/cert.pem && \
    apk del openssl

# =============================================================================
# PERMISSIONS
# =============================================================================

# Définir les bonnes permissions
RUN chown -R nginx:nginx /var/cache/nginx \
                        /var/log/nginx \
                        /var/www/html && \
    chmod -R 755 /var/cache/nginx \
                /var/log/nginx

# =============================================================================
# HEALTH CHECK
# =============================================================================

# Health check pour Nginx
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/api/health || exit 1

# =============================================================================
# EXPOSE
# =============================================================================

# Ports HTTP et HTTPS
EXPOSE 80 443

# =============================================================================
# DÉMARRAGE
# =============================================================================

# Utiliser la commande par défaut de nginx
CMD ["nginx", "-g", "daemon off;"]
