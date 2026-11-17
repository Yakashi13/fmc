# Autodeploy on kuzyo

kuzyo polls GitHub every 5 minutes (`fmc-autodeploy.timer`). When `main` has a new commit
whose CI run passed, it builds that commit in `node:24-slim` and rsyncs `build/` into
`/srv/pets/fmc/www`. The last deployed SHA is in `/var/lib/fmc-autodeploy/deployed`.

Install or update (from this repo):

    scp deploy/autodeploy.sh kuzyo:/usr/local/bin/fmc-autodeploy
    scp deploy/fmc-autodeploy.service deploy/fmc-autodeploy.timer kuzyo:/etc/systemd/system/
    ssh kuzyo 'systemctl daemon-reload && systemctl enable --now fmc-autodeploy.timer'

Logs: `ssh kuzyo journalctl -u fmc-autodeploy -n 50`. Force a redeploy of the current
`main`: `ssh kuzyo 'rm /var/lib/fmc-autodeploy/deployed && systemctl start fmc-autodeploy'`.
