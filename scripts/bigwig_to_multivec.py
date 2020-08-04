import h5py
import bbi
import negspy.coordinates as nc
import numpy as np
import math
import argparse
import json
import os
import resource

GENOME_BUILD = 'hg19'
GENOME_LENGTH = sum(nc.get_chromsizes(GENOME_BUILD)[:25])

def bigwigs_to_multivec(
    input_bigwig_files,
    output_file,
    starting_resolution
):

    f = h5py.File(output_file, 'w')

    num_samples = len(input_bigwig_files)

    # Create level zero groups
    info_group = f.create_group("info")
    resolutions_group = f.create_group("resolutions")
    chroms_group = f.create_group("chroms")

    # Set info attributes
    info_group.attrs['tile-size'] = 256

    # Prepare to fill in chroms dataset
    chromosomes = nc.get_chromorder(GENOME_BUILD)
    chromosomes = chromosomes[:25] # TODO: should more than chr1-chrM be used?
    chroms_length_arr = np.array([ nc.get_chrominfo('hg19').chrom_lengths[x] for x in chromosomes ], dtype="i8")
    chroms_name_arr = np.array(chromosomes, dtype="S23")

    chromosomes_set = set(chromosomes)
    chrom_name_to_length = dict(zip(chromosomes, chroms_length_arr))

    # Fill in chroms dataset entries "length" and "name"
    chroms_group.create_dataset("length", data=chroms_length_arr)
    chroms_group.create_dataset("name", data=chroms_name_arr)

    num_zoom_levels = math.floor(math.log2(GENOME_LENGTH / starting_resolution))

    # Prepare to fill in resolutions dataset
    resolutions = [starting_resolution * (2 ** x) for x in range(num_zoom_levels)]

    # Create each resolution group.
    for resolution in resolutions:
        resolution_group = resolutions_group.create_group(str(resolution))
        # TODO: remove the unnecessary "values" layer
        resolution_values_group = resolution_group.create_group("values")

        # Create each chromosome dataset.
        for chr_name, chr_len in zip(chromosomes, chroms_length_arr):
            chr_shape = (math.ceil(chr_len / resolution), num_samples)
            resolution_values_group.create_dataset(chr_name, chr_shape, dtype="f4", fillvalue=np.nan, compression='gzip')

    # Fill in data for each bigwig file.
    for bw_index, bw_file in enumerate(input_bigwig_files):
        if bbi.is_bigwig(bw_file):
            chromsizes = bbi.chromsizes(bw_file)
            matching_chromosomes = set(chromsizes.keys()).intersection(chromosomes_set)

            # Fill in data for each resolution of a bigwig file.
            for resolution in resolutions:
                # Fill in data for each chromosome of a resolution of a bigwig file.
                for chr_name in matching_chromosomes:
                    chr_len = chrom_name_to_length[chr_name]
                    num_bins = math.ceil(chr_len / resolution)
                    arr = bbi.fetch(bw_file, chr_name, 0, chr_len, num_bins, summary="sum")
                    resolutions_group[str(resolution)]["values"][chr_name][:,bw_index] = arr
        else:
            print(f"{bw_file} not is_bigwig")

        f.flush()

    f.close()

    max_mem = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
    print(max_mem)

    # Append metadata to the top resolution row_infos attribute.
    row_infos = []
    for input_bigwig_file in input_bigwig_files:
        _, filename = os.path.split(input_bigwig_file)
        name, _ = os.path.splitext(filename)
        row_infos.append({
            'id': name
        })

    row_infos_encoded = str(json.dumps(row_infos))

    f = h5py.File(output_file, 'r+')

    info_group = f["info"]
    info_group["row_infos"] = row_infos_encoded

    f.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Create a multivec file.')
    parser.add_argument('-i', '--input', type=str, required=True, help='The input directory or manifest JSON file.')
    parser.add_argument('-o', '--output', type=str, required=True, help='The output multivec file.')
    parser.add_argument('-s', '--starting-resolution', type=int, default=25, help='The starting resolution.')
    args = parser.parse_args()

    if args.input.endswith('.json'):
        with open(args.input) as f:
            input_bigwig_files = json.load(f)
    else:
        _, _, input_bigwig_files = next(os.walk(args.input), (None, None, []))
        input_bigwig_files = [os.path.join(args.input, f) for f in input_bigwig_files]

    bigwigs_to_multivec(
        input_bigwig_files,
        args.output,
        args.starting_resolution
    )
