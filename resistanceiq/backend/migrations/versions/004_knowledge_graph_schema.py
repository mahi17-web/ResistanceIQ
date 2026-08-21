"""Knowledge Graph Schema (Crops, Crop Threats, Protein Records, Structures, Sync Audits)

Revision ID: 004_knowledge_graph_schema
Revises: 003_user_auth_lifecycle_schema
Create Date: 2026-08-19 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '004_knowledge_graph_schema'
down_revision: Union[str, None] = '003_user_auth_lifecycle_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create crops table
    op.create_table(
        'crops',
        sa.Column('id', sa.String(length=64), nullable=False),
        sa.Column('common_name', sa.String(length=128), nullable=False),
        sa.Column('scientific_name', sa.String(length=128), nullable=False),
        sa.Column('family', sa.String(length=64), nullable=True),
        sa.Column('genus', sa.String(length=64), nullable=True),
        sa.Column('species', sa.String(length=64), nullable=True),
        sa.Column('crop_code', sa.String(length=32), nullable=True),
        sa.Column('ncbi_tax_id', sa.Integer(), nullable=True),
        sa.Column('taxonomy_status', sa.String(length=32), nullable=False, server_default='RESOLVED'),
        sa.Column('taxonomy_rank', sa.String(length=32), nullable=False, server_default='species'),
        sa.Column('taxonomy_lineage', sa.Text(), nullable=True),
        sa.Column('synonyms', sa.Text(), nullable=True),
        sa.Column('source', sa.String(length=128), nullable=False, server_default='FAO Indicative Crop Classification (ICC) v1.1'),
        sa.Column('source_version', sa.String(length=32), nullable=False, server_default='ICC-1.1-2020'),
        sa.Column('evidence_level', sa.String(length=32), nullable=False, server_default='OFFICIAL_FAO_CLASSIFICATION'),
        sa.Column('retrieved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_crops_common_name', 'crops', ['common_name'], unique=False)
    op.create_index('ix_crops_scientific_name', 'crops', ['scientific_name'], unique=False)
    op.create_index('ix_crops_crop_code', 'crops', ['crop_code'], unique=False)
    op.create_index('ix_crops_ncbi_tax_id', 'crops', ['ncbi_tax_id'], unique=False)

    # 2. Create crop_threats table
    op.create_table(
        'crop_threats',
        sa.Column('id', sa.String(length=64), nullable=False),
        sa.Column('crop_id', sa.String(length=64), nullable=False),
        sa.Column('organism_id', sa.String(length=64), nullable=False),
        sa.Column('organism_name', sa.String(length=128), nullable=False),
        sa.Column('common_name', sa.String(length=128), nullable=True),
        sa.Column('organism_type', sa.String(length=32), nullable=False, server_default='insect'),
        sa.Column('ncbi_tax_id', sa.Integer(), nullable=True),
        sa.Column('relationship', sa.String(length=64), nullable=False, server_default='PRIMARY_HOST'),
        sa.Column('source', sa.String(length=128), nullable=False, server_default='EPPO Global Database / CABI CPC'),
        sa.Column('source_version', sa.String(length=32), nullable=False, server_default='2024.1'),
        sa.Column('evidence_level', sa.String(length=32), nullable=False, server_default='FIELD_OBSERVED'),
        sa.Column('confidence_score', sa.Float(), nullable=False, server_default='1.0'),
        sa.Column('citation', sa.Text(), nullable=True),
        sa.Column('retrieved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['crop_id'], ['crops.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_crop_threats_crop_id', 'crop_threats', ['crop_id'], unique=False)
    op.create_index('ix_crop_threats_organism_id', 'crop_threats', ['organism_id'], unique=False)
    op.create_index('ix_crop_threats_organism_name', 'crop_threats', ['organism_name'], unique=False)
    op.create_index('ix_crop_threats_ncbi_tax_id', 'crop_threats', ['ncbi_tax_id'], unique=False)

    # 3. Create protein_records table
    op.create_table(
        'protein_records',
        sa.Column('id', sa.String(length=64), nullable=False),
        sa.Column('uniprot_accession', sa.String(length=32), nullable=False),
        sa.Column('target_id', sa.String(length=64), nullable=True),
        sa.Column('protein_name', sa.String(length=255), nullable=False),
        sa.Column('gene_primary', sa.String(length=64), nullable=True),
        sa.Column('organism_name', sa.String(length=128), nullable=False),
        sa.Column('ncbi_tax_id', sa.Integer(), nullable=True),
        sa.Column('sequence', sa.Text(), nullable=True),
        sa.Column('sequence_length', sa.Integer(), nullable=True),
        sa.Column('functional_description', sa.Text(), nullable=True),
        sa.Column('active_sites_json', sa.Text(), nullable=True),
        sa.Column('cross_references_json', sa.Text(), nullable=True),
        sa.Column('source', sa.String(length=64), nullable=False, server_default='UniProtKB/Swiss-Prot'),
        sa.Column('source_version', sa.String(length=32), nullable=False, server_default='2024_04'),
        sa.Column('retrieved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['target_id'], ['targets.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_protein_records_uniprot_accession', 'protein_records', ['uniprot_accession'], unique=True)
    op.create_index('ix_protein_records_target_id', 'protein_records', ['target_id'], unique=False)

    # 4. Create protein_structures table
    op.create_table(
        'protein_structures',
        sa.Column('id', sa.String(length=64), nullable=False),
        sa.Column('target_id', sa.String(length=64), nullable=False),
        sa.Column('protein_record_id', sa.String(length=64), nullable=True),
        sa.Column('uniprot_accession', sa.String(length=32), nullable=False),
        sa.Column('pdb_id', sa.String(length=32), nullable=True),
        sa.Column('chain_id', sa.String(length=16), nullable=False, server_default='A'),
        sa.Column('structure_type', sa.String(length=32), nullable=False),
        sa.Column('structure_source', sa.String(length=64), nullable=False),
        sa.Column('experimental_method', sa.String(length=64), nullable=True),
        sa.Column('resolution', sa.Float(), nullable=True),
        sa.Column('structure_url', sa.String(length=512), nullable=True),
        sa.Column('cif_url', sa.String(length=512), nullable=True),
        sa.Column('alphafold_model_url', sa.String(length=512), nullable=True),
        sa.Column('retrieval_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['target_id'], ['targets.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['protein_record_id'], ['protein_records.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_protein_structures_target_id', 'protein_structures', ['target_id'], unique=False)
    op.create_index('ix_protein_structures_protein_record_id', 'protein_structures', ['protein_record_id'], unique=False)
    op.create_index('ix_protein_structures_uniprot_accession', 'protein_structures', ['uniprot_accession'], unique=False)
    op.create_index('ix_protein_structures_pdb_id', 'protein_structures', ['pdb_id'], unique=False)

    # 5. Create knowledge_sync_audits table
    op.create_table(
        'knowledge_sync_audits',
        sa.Column('id', sa.String(length=64), nullable=False),
        sa.Column('sync_type', sa.String(length=64), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='COMPLETED'),
        sa.Column('records_added', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('records_updated', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('records_rejected', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('error_log', sa.Text(), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    # 6. Alter targets table to add organism_id and irac_moa_group
    with op.batch_alter_table('targets', schema=None) as batch_op:
        batch_op.add_column(sa.Column('organism_id', sa.String(length=64), nullable=True))
        batch_op.add_column(sa.Column('irac_moa_group', sa.String(length=16), nullable=True))
        batch_op.create_index('ix_targets_organism_id', ['organism_id'], unique=False)
        batch_op.create_index('ix_targets_irac_moa_group', ['irac_moa_group'], unique=False)


def downgrade() -> None:
    with op.batch_alter_table('targets', schema=None) as batch_op:
        batch_op.drop_index('ix_targets_irac_moa_group')
        batch_op.drop_index('ix_targets_organism_id')
        batch_op.drop_column('irac_moa_group')
        batch_op.drop_column('organism_id')

    op.drop_table('knowledge_sync_audits')
    op.drop_table('protein_structures')
    op.drop_table('protein_records')
    op.drop_table('crop_threats')
    op.drop_table('crops')
