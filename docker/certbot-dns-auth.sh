#!/bin/bash
# Hook d'authentification certbot DNS-01 — version robuste v2.
# Les NS Hostinger (ns1/ns2.dns-parking.com) se synchronisent lentement (~15 min).
# On n'autorise certbot à continuer que lorsque la valeur TXT est présente sur
# TOUS les serveurs autoritaires EN MÊME TEMPS (sinon LE tombe sur un NS en
# retard et refuse). On reconstruit la liste des NS à CHAQUE tour (pas une seule
# fois) pour ne pas rester coincé sur une résolution vide transitoire, avec une
# liste de secours codée en dur.
set -u
RECORD="_acme-challenge.${CERTBOT_DOMAIN}"
ZONE=$(echo "${CERTBOT_DOMAIN}" | awk -F. '{print $(NF-1)"."$NF}')
FALLBACK_NS="ns1.dns-parking.com ns2.dns-parking.com"
echo "RECORD=${RECORD} VALUE=${CERTBOT_VALIDATION}" >> /tmp/acme-challenges.txt

for i in $(seq 1 240); do   # 240 * 20s = 80 min max
  NS_LIST=$(dig +short NS "${ZONE}" @8.8.8.8 | tr -d '"')
  [ -z "${NS_LIST}" ] && NS_LIST="${FALLBACK_NS}"

  all_ok=1
  seen=""
  for ns in ${NS_LIST}; do
    if dig +short TXT "${RECORD}" "@${ns}" | tr -d '"' | grep -qFx "${CERTBOT_VALIDATION}"; then
      seen="${seen} ${ns}=OK"
    else
      seen="${seen} ${ns}=NON"
      all_ok=0
    fi
  done

  if [ "${all_ok}" = "1" ]; then
    sleep 15   # marge avant de rendre la main à Let's Encrypt
    echo "VALIDE ${RECORD} ${CERTBOT_VALIDATION} (${seen} )" >> /tmp/acme-challenges.txt
    exit 0
  fi
  echo "wait i=${i}${seen}" >> /tmp/acme-challenges.txt
  sleep 20
done
echo "TIMEOUT ${RECORD} ${CERTBOT_VALIDATION}" >> /tmp/acme-challenges.txt
exit 1
