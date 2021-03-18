# Columns:
# chr
# start
# end
# name
# class
# activity_base
# TargetGene
# TargetGeneTSS
# TargetGeneExpression
# TargetGenePromoterActivityQuantile
# TargetGeneIsExpressed
# distance
# isSelfPromoter
# hic_contact
# powerlaw_contact
# powerlaw_contact_reference
# hic_contact_pl_scaled
# hic_pseudocount
# hic_contact_pl_scaled_adj
# ABC.Score.Numerator
# ABC.Score
# powerlaw.Score.Numerator
# powerlaw.Score
# CellType

clodius aggregate bedfile\
  --assembly=hg19\
  --output-file="$1.hg19.beddb"\
  --importance-column=6\
  --max-per-tile=2000\
  --tile-size=1024\
  --has-header\
  --verbose\
  $1
