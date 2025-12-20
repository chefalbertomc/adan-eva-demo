#!/bin/bash
cd "$(dirname "$0")"
clear
echo "=========================================================="
echo "       🟢 ADAN & EVA POS - SERVIDOR PARA TABLET 🟢"
echo "=========================================================="
echo ""
echo "PASO 1: Asegúrate que tu Mac y la Tablet estén en el MISMO WiFi."
echo ""
echo "PASO 2: Abre el navegador en tu Tablet (Chrome/Safari)."
echo ""
echo "PASO 3: Escribe esta dirección en la barra de arriba:"
echo ""

# Intentar obtener IP de WiFi (en0 suele ser wifi)
IP=$(ipconfig getifaddr en0)
if [ -z "$IP" ]; then
    # Intentar en1 si en0 falla
    IP=$(ipconfig getifaddr en1)
fi

if [ -z "$IP" ]; then
    echo "⚠️  No se detectó WiFi. Conecta tu Mac a internet."
    echo "    Intentando mostrar todas las IPs:"
    ifconfig | grep "inet " | grep -v 127.0.0.1
else 
    echo "          http://$IP:8000"
fi

echo ""
echo "=========================================================="
echo "⚠️  IMPORTANTE: NO CIERRES ESTA VENTANA NEGRA"
echo "    (Para detener el servidor, cierra esta ventana)"
echo "=========================================================="
echo ""
python3 -m http.server 8000
