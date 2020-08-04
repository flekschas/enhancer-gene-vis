#!/usr/bin/env python

import argparse
import os
import pathlib
import shutil
import urllib.request as request
from contextlib import closing

def get_file_urls():
    from ftplib import FTP

    protocol = 'ftp://'
    host = 'ftp.broadinstitute.org'
    base_path = '/outgoing/lincRNA/ABC/bigWig/'

    with FTP('ftp.broadinstitute.org') as ftp:
        ftp.login()
        file_urls = []
        for file_name, facts in ftp.mlsd('outgoing/lincRNA/ABC/bigWig/'):
            if facts['type'] != 'dir' and file_name.endswith('accessibility.bw'):
                file_urls.append(
                    protocol + host + base_path + file_name
                )

    return file_urls

def download_file_from_ftp(
    url: str,
    base: str = ".",
    dir: str = "data",
    overwrite: bool = False,
):
    _, filename = os.path.split(url)
    filepath = os.path.join(base, dir, filename)

    if pathlib.Path(filepath).is_file() and not overwrite:
        print(f'{filename} already exist! To overwrite set `overwrite=True`')
        return

    print(f'Download {filename} ', end='', flush=True)

    with closing(request.urlopen(url)) as r:
        with open(filepath, 'wb') as f:
            shutil.copyfileobj(r, f)

    print('done!', flush=True)


def download(base: str = ".", dir: str = "data", overwrite: bool = False):
    pathlib.Path(dir).mkdir(parents=True, exist_ok=True)

    file_urls = get_file_urls()

    for file_url in file_urls:
        download_file_from_ftp(file_url, base=base, dir=dir, overwrite=overwrite)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Download bigwigs.')
    parser.add_argument('-b', '--base', type=str, default='.', help='Base directory')
    parser.add_argument('-d', '--dir', type=str, default='data', help='Data directory (relative to the base directory)')
    parser.add_argument('-o', '--overwrite', action="store_true", help="if true overwrite files")
    args = parser.parse_args()

    download(args.base, args.dir, args.overwrite)
