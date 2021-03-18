#!/usr/bin/env python

import argparse
import pandas as pd

drop_cols = [
    'name',
    'class',
    'activity_base',
    'TargetGeneExpression',
    'TargetGenePromoterActivityQuantile',
    'TargetGeneIsExpressed',
    'distance',
    'isSelfPromoter',
    'hic_contact',
    'powerlaw_contact',
    'powerlaw_contact_reference',
    'hic_contact_pl_scaled',
    'hic_pseudocount',
    'hic_contact_pl_scaled_adj',
    'ABC.Score.Numerator',
    'powerlaw.Score.Numerator',
    'powerlaw.Score',
]

def simplify(filepath):
    df = pd.read_csv(filepath, sep='\t')

    for col in drop_cols:
        del df[col]

    df.columns = [
        'chrom', 'start', 'end', 'geneName', 'geneTss', 'abcScore', 'cellType'
    ]

    df.to_csv(
        f'{filepath[0:-3]}.simplified.gz', sep='\t', index=False, compression='gzip'
    )

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Simplify bed file')
    parser.add_argument('file', type=str, help='Bed file to be simplified')
    args = parser.parse_args()

    simplify(args.file)
