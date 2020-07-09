import click
import higlass as hg
import negspy.coordinates
import os


def bedpedb(filepath, uuid=None, **kwargs):
    from clodius.tiles.bed2ddb import tileset_info, tiles

    return hg.Tileset(
        uuid=uuid,
        tileset_info=lambda: tileset_info(filepath),
        tiles=lambda tile_ids: tiles(filepath, tile_ids),
        **kwargs
    )


def get_filename_assembly(filepath):
    _, filenameext = os.path.split(filepath)
    parts = filenameext.split('.')
    assembly = parts[-2]

    if assembly in negspy.coordinates.available_chromsizes():
        return ''.join(parts[:-2]), assembly

    return ''.join(parts[:-1]), None


def get_chromsizes(filename):
    assembly = filename.split('.')[-2]

    if assembly in negspy.coordinates.available_chromsizes():
        return negspy.coordinates.get_chromsizes(assembly)

    return None


def bigwig_to_tileset(filepath):
    filename, assembly = get_filename_assembly(filepath)

    if assembly is not None:
        chromsizes = negspy.coordinates.get_chromsizes(assembly)
        return hg.tilesets.bigwig(
            filepath=filepath,
            chromsizes=chromsizes,
            name=filename,
            uuid=filename,
            datatype='vector',
        )


def beddb_to_tileset(filepath):
    filename, assembly = get_filename_assembly(filepath)

    if assembly is not None:
        chromsizes = negspy.coordinates.get_chromsizes(assembly)
        return hg.tilesets.beddb(
            filepath=filepath,
            chromsizes=chromsizes,
            name=filename,
            uuid=filename,
            datatype='bedlike',
        )


def bedpedb_to_tileset(filepath):
    filename, assembly = get_filename_assembly(filepath)

    if assembly is not None:
        chromsizes = negspy.coordinates.get_chromsizes(assembly)
        return bedpedb(
            filepath=filepath,
            chromsizes=chromsizes,
            name=filename,
            uuid=filename,
            datatype='bedlike',
        )


def is_not_none(x):
    return x is not None


@click.command()
@click.argument('dir')
@click.option('--host', '-h', type=str, default='localhost', show_default=True)
@click.option('--port', '-p', type=int, default=9876, show_default=True)
@click.option('--verbose', '-v', count=True)
def serve(dir, host, port, verbose):
    bigwigs = []
    bigbeds = []
    beddbs = []
    bedpedbs = []

    for file in os.listdir(dir):
        if file.endswith('.bigwig'):
            bigwigs.append(os.path.join(dir, file))
        if file.endswith('.bigbed'):
            bigbeds.append(os.path.join(dir, file))
        if file.endswith('.beddb'):
            beddbs.append(os.path.join(dir, file))
        if file.endswith('.bedpedb'):
            bedpedbs.append(os.path.join(dir, file))

    if verbose > 0:
        print(f'Found {len(bigwigs)} .bigwig files')
        print(f'Found {len(bigbeds)} .bigbed files')
        print(f'Found {len(beddbs)} .beddb files')
        print(f'Found {len(bedpedbs)} .bedpedb files')

    tilesets = [
        *list(filter(is_not_none, map(bigwig_to_tileset, bigwigs))),
        *list(filter(is_not_none, map(beddb_to_tileset, beddbs))),
        *list(filter(is_not_none, map(bedpedb_to_tileset, bedpedbs)))
    ]

    if len(tilesets) > 0:
        server = hg.server.create_app('higlass', tilesets)
        print(f'Serving {len(tilesets)} tilesets from http://{host}:{9876}')
        print(f'See http://{host}:{9876}/api/v1/tilesets/')
        server.run(
            threaded=True,
            debug=True,
            host=host,
            port=9876,
            use_reloader=False
        )
    else:
        print('Nothing to serve my lord! Good night.')

if __name__ == '__main__':
    serve()
