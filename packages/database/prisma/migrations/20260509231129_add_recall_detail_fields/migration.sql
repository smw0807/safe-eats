-- AlterTable
ALTER TABLE "recalls" ADD COLUMN     "address" TEXT,
ADD COLUMN     "barcode_no" TEXT,
ADD COLUMN     "expiry_date" TEXT,
ADD COLUMN     "image_urls" TEXT[],
ADD COLUMN     "license_no" TEXT,
ADD COLUMN     "manufactured_at" TEXT,
ADD COLUMN     "packaging_unit" TEXT,
ADD COLUMN     "product_report_no" TEXT,
ADD COLUMN     "product_type" TEXT,
ADD COLUMN     "product_type_name" TEXT,
ADD COLUMN     "recall_grade" TEXT,
ADD COLUMN     "recall_method" TEXT,
ADD COLUMN     "tel_no" TEXT;
