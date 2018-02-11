#!/bin/bash
./ai.exp "$(cat "$ENCFS_CREDS")" "$1" | tail -n 1
