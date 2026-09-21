"""product catalog: cut over product to brand/model/category FKs

Revision ID: 0049
Revises: 0048
Create Date: 2026-09-21

Changes (docs/Product-Catalog-Name-Derivation-Implementation-Plan.md): the
second of two migrations closing Signed Feature 4.1's free-text Brand/
Category gap. Seeds the real 59-product catalog (Haroon's corrected
Brand/Category/Model list, decided with Basheer 2026-09-20/21) into brand/
category/model, cuts `product` over to brand_id/model_id/category_id FKs,
and retires every product not in the corrected list.

  - Written to run correctly against either Dev or UAT, since the same
    migration chain reaches both -- Dev's product table (checked 2026-09-21)
    is NOT a mirror of UAT's: it holds a handful of leftover seed/test rows
    under old dddddddd-... ids, missing 35 of the real 65 UAT products, plus
    4 products (ECG Cable, Heart-Lung Machine, Siemens USG M/c, Sonoscape
    Test) that don't exist in UAT or Haroon's list at all. A migration that
    hardcoded product ids for the update-in-place path would silently
    duplicate every real UAT product once this migration is later promoted
    there (UAT already has these under its own real, referenced ids).
  - Fix: each of the 59 corrected products carries the OLD row's exact
    name (unique in both environments, traced by hand against Haroon's
    file). At migration time: if a product with that exact name already
    exists in this database, it's UPDATEd in place (brand_id/model_id/
    category_id set, is_active forced true) -- preserves whatever id it
    already has, so every existing FK (opportunity_item, installed_asset,
    document) keeps pointing at a valid row. If no match is found, a fresh
    row is INSERTed (gen_random_uuid()). On Dev today this splits roughly
    26 updates / 32 inserts; once promoted to UAT, all 58 will match by
    name and update in place (plus 1 unconditional insert for the genuinely
    new 'EDAN F9', which cannot match anything in either environment).
  - Retirement is the mirror image, also name-driven rather than a fixed
    id list: after the 59-product backfill, ANY product row still without
    a model_id (the 5 real duplicates/redundant entries Basheer decided to
    drop, both old wall-mount-stand rows, and -- Dev-only -- the 4 unrelated
    leftover rows above) is deleted if nothing references it, or otherwise
    deactivated and pointed at a small internal 'Legacy Data' Brand/
    Category/Model landing spot (is_active=false, never shown in any
    picker) so the NOT NULL constraint below can still apply to it without
    losing whatever real Activity/Document/OpportunityItem history points
    at it.
  - Brand-to-SBU assignment (SonoScape -> Imaging, every other brand ->
    Critical Care) confirmed against both Dev's and UAT's existing live
    product.sbu_id tagging before writing this migration (read-only checks,
    2026-09-21, Basheer's go-ahead given for both) -- not a guess.
"""

import sqlalchemy as sa
from sqlalchemy import text
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "0049"
down_revision = "0048"
branch_labels = None
depends_on = None

SBU_IMAGING = "88888888-8888-8888-8888-800000000001"
SBU_CRITICAL_CARE = "88888888-8888-8888-8888-800000000002"

# (id, sbu_id, name)
BRANDS = [
    ('16953418-d885-4c43-9a18-da71ed8c1620', SBU_CRITICAL_CARE, 'AVI Health care'),
    ('586b9e1f-aeea-4fb8-a463-6de97239d3d6', SBU_CRITICAL_CARE, 'Aeonmed'),
    ('8ef39e20-ca2a-48e2-aa6b-1a75db8f61b1', SBU_CRITICAL_CARE, 'EDAN'),
    ('6de8e7d6-33cb-422b-9c63-56ac08d8d764', SBU_CRITICAL_CARE, 'ELECTROSCIENCE'),
    ('c9b958cc-fa54-4eca-8b94-fa1ef409e377', SBU_CRITICAL_CARE, 'Kolkatta'),
    ('172ad1df-1271-47ca-9d81-6fe8c519a2c9', SBU_CRITICAL_CARE, 'Magnamed'),
    ('e2136571-1163-4183-a1ec-1d2c1aa5852a', SBU_CRITICAL_CARE, 'Maquet'),
    ('59bd2f79-c127-4778-ae8b-a95326d65739', SBU_CRITICAL_CARE, 'Medion'),
    ('c6b28947-8cdd-4ce5-94df-0862a64a007b', SBU_IMAGING, 'SonoScape'),
    ('4a3ead75-882f-4e88-90d7-078351697f7e', SBU_CRITICAL_CARE, 'Legacy Data'),
]

# (id, sbu_id, name)
CATEGORIES = [
    ('9a79fe1b-2ee9-4895-b5fa-24b7df9f2e15', SBU_CRITICAL_CARE, 'Anesthesia Machine Basic'),
    ('68dcd66e-c136-4e68-8999-b9b30637418d', SBU_CRITICAL_CARE, 'Anesthesia Workstation'),
    ('3080242f-9d6d-4173-977f-a5ac826a40f7', SBU_CRITICAL_CARE, 'Blood Gas Analyzer'),
    ('a6cd2ef7-b597-47c9-ad7c-d73af10b0ab7', SBU_CRITICAL_CARE, 'Bubble CPAP & HFNC'),
    ('c9be210e-32dd-4bb4-b88a-e03eb142bfe3', SBU_CRITICAL_CARE, 'Colposcope'),
    ('5c0f4675-3817-4274-a265-402942b8e8af', SBU_CRITICAL_CARE, 'ECG Machine'),
    ('c88fb5a8-5f62-409c-90f2-8c8d36cc2c51', SBU_CRITICAL_CARE, 'ECG Software'),
    ('3a1fc9d6-79ae-4ea7-aa85-fae437af7098', SBU_IMAGING, 'Endoscopy'),
    ('7490b056-c36e-485c-a8f9-71b5701d080e', SBU_CRITICAL_CARE, 'Fetal Doppler'),
    ('de586d80-f06a-4f69-a1b4-2cf0aef79329', SBU_CRITICAL_CARE, 'Infusion Pump'),
    ('7fe4090b-0221-42b2-a46a-851b79ed0108', SBU_CRITICAL_CARE, 'Maternal & Fetal Monitor'),
    ('df42d0dd-611d-41b3-9208-df6a3a074c81', SBU_CRITICAL_CARE, 'Patient Monitor'),
    ('63e4017a-7e1c-4db1-a20a-f987a28d4b03', SBU_IMAGING, 'Portable USG Machine'),
    ('db094e92-444a-46c6-ae0b-96baae8f4a99', SBU_CRITICAL_CARE, 'Pulseoxymeter'),
    ('6e7787be-ea1d-4c60-ba81-71db5f1d46a1', SBU_CRITICAL_CARE, 'Syringe Pump'),
    ('43cd1178-a8cc-4926-b1b7-2ec1b6164929', SBU_CRITICAL_CARE, 'Transport Incubator'),
    ('0f434784-05ff-4a0c-925f-1fb92f2089ba', SBU_CRITICAL_CARE, 'Transport Ventilator'),
    ('f788f496-5670-4cdf-998e-5fa381834c03', SBU_IMAGING, 'USG Machine'),
    ('441f5a46-1306-4709-a904-e1b76b32a83c', SBU_CRITICAL_CARE, 'Ventilator'),
    ('6518d894-5d2c-4047-b8c8-245883c57d56', SBU_CRITICAL_CARE, 'Vital Signe Monitor'),
    ('b76b8956-f2c6-46e5-8956-eb707b4413e6', SBU_CRITICAL_CARE, 'Retired / Unclassified'),
]

# (id, brand_id, category_id, sbu_id, name)
MODELS = [
    ('558a8e4c-2d82-4f6c-a5b8-5d1226655eaa', '16953418-d885-4c43-9a18-da71ed8c1620', '43cd1178-a8cc-4926-b1b7-2ec1b6164929', SBU_CRITICAL_CARE, 'Transnano'),
    ('c06b800d-11f3-4b2d-a975-de92beac86ce', '586b9e1f-aeea-4fb8-a463-6de97239d3d6', '68dcd66e-c136-4e68-8999-b9b30637418d', SBU_CRITICAL_CARE, '7200A'),
    ('8ced100f-4e27-49f8-9fa5-1020a1df4dce', '8ef39e20-ca2a-48e2-aa6b-1a75db8f61b1', '3080242f-9d6d-4173-977f-a5ac826a40f7', SBU_CRITICAL_CARE, 'i15'),
    ('6820f5dd-2c3e-4470-b2cb-875913ef90e6', '8ef39e20-ca2a-48e2-aa6b-1a75db8f61b1', 'c9be210e-32dd-4bb4-b88a-e03eb142bfe3', SBU_CRITICAL_CARE, 'C6A-HD'),
    ('2344effd-98fe-4dce-a335-4df2bf49807d', '8ef39e20-ca2a-48e2-aa6b-1a75db8f61b1', '5c0f4675-3817-4274-a265-402942b8e8af', SBU_CRITICAL_CARE, 'SE-1200 Express'),
    ('76cb8a6b-d567-4974-bba5-9fd2b6368d0e', '8ef39e20-ca2a-48e2-aa6b-1a75db8f61b1', '5c0f4675-3817-4274-a265-402942b8e8af', SBU_CRITICAL_CARE, 'SE-1202E'),
    ('f45e20bb-74b1-4903-83c1-920d8a172845', '8ef39e20-ca2a-48e2-aa6b-1a75db8f61b1', '5c0f4675-3817-4274-a265-402942b8e8af', SBU_CRITICAL_CARE, 'SE-310'),
    ('8fc043af-3a2c-4fdc-81a9-9f604dfaed24', '8ef39e20-ca2a-48e2-aa6b-1a75db8f61b1', '5c0f4675-3817-4274-a265-402942b8e8af', SBU_CRITICAL_CARE, 'SE3'),
    ('6da69e64-2e57-4c12-9c9f-71e149ad9e5c', '8ef39e20-ca2a-48e2-aa6b-1a75db8f61b1', 'c88fb5a8-5f62-409c-90f2-8c8d36cc2c51', SBU_CRITICAL_CARE, 'SE- 1515'),
    ('1ad539aa-1827-4687-8c77-df50da8b67b9', '8ef39e20-ca2a-48e2-aa6b-1a75db8f61b1', '7490b056-c36e-485c-a8f9-71b5701d080e', SBU_CRITICAL_CARE, 'Sonotrax Basic'),
    ('f311abae-0e69-41b7-94de-105bc088b5d4', '8ef39e20-ca2a-48e2-aa6b-1a75db8f61b1', '7fe4090b-0221-42b2-a46a-851b79ed0108', SBU_CRITICAL_CARE, 'F15'),
    ('b60b6e6e-8bfc-447c-8c35-601a09c48a8a', '8ef39e20-ca2a-48e2-aa6b-1a75db8f61b1', '7fe4090b-0221-42b2-a46a-851b79ed0108', SBU_CRITICAL_CARE, 'F3'),
    ('434d450e-d806-4978-b6b9-4ccfe82821a9', '8ef39e20-ca2a-48e2-aa6b-1a75db8f61b1', '7fe4090b-0221-42b2-a46a-851b79ed0108', SBU_CRITICAL_CARE, 'F6'),
    ('fc416528-fa96-4291-88f7-5da32a6dfc1e', '8ef39e20-ca2a-48e2-aa6b-1a75db8f61b1', 'df42d0dd-611d-41b3-9208-df6a3a074c81', SBU_CRITICAL_CARE, 'CX 10'),
    ('1cb278f9-42a9-413c-95ea-6fb5673895a9', '8ef39e20-ca2a-48e2-aa6b-1a75db8f61b1', 'df42d0dd-611d-41b3-9208-df6a3a074c81', SBU_CRITICAL_CARE, 'CX12'),
    ('cc344127-b24e-4feb-86bf-5efdd8ec6a86', '8ef39e20-ca2a-48e2-aa6b-1a75db8f61b1', 'df42d0dd-611d-41b3-9208-df6a3a074c81', SBU_CRITICAL_CARE, 'IV6'),
    ('9585887f-a4d1-4282-90b6-1d80b518ec0e', '8ef39e20-ca2a-48e2-aa6b-1a75db8f61b1', 'df42d0dd-611d-41b3-9208-df6a3a074c81', SBU_CRITICAL_CARE, 'IX 12 With IBP & ETCO2'),
    ('23e50611-829c-43f4-a7a2-8d8b11dbd454', '8ef39e20-ca2a-48e2-aa6b-1a75db8f61b1', 'df42d0dd-611d-41b3-9208-df6a3a074c81', SBU_CRITICAL_CARE, 'IX Nelcore'),
    ('401eebca-991e-45b5-bcd5-d94307e765a9', '8ef39e20-ca2a-48e2-aa6b-1a75db8f61b1', 'df42d0dd-611d-41b3-9208-df6a3a074c81', SBU_CRITICAL_CARE, 'X12'),
    ('63d9b107-3be0-46e8-93bd-abab947a9c8d', '8ef39e20-ca2a-48e2-aa6b-1a75db8f61b1', 'df42d0dd-611d-41b3-9208-df6a3a074c81', SBU_CRITICAL_CARE, 'elite V5'),
    ('ac29bef2-bdfd-4b5f-a917-6489272cd4d6', '8ef39e20-ca2a-48e2-aa6b-1a75db8f61b1', 'df42d0dd-611d-41b3-9208-df6a3a074c81', SBU_CRITICAL_CARE, 'elite V6'),
    ('b9db9ff0-9b98-4f9a-aa5d-57a65f21d6df', '8ef39e20-ca2a-48e2-aa6b-1a75db8f61b1', 'df42d0dd-611d-41b3-9208-df6a3a074c81', SBU_CRITICAL_CARE, 'elite V8'),
    ('0134199d-fcfb-45ed-bb52-85dd48e8d507', '8ef39e20-ca2a-48e2-aa6b-1a75db8f61b1', 'df42d0dd-611d-41b3-9208-df6a3a074c81', SBU_CRITICAL_CARE, 'iM20'),
    ('ee946df4-db64-4341-90ac-d7c438ec0dac', '8ef39e20-ca2a-48e2-aa6b-1a75db8f61b1', 'df42d0dd-611d-41b3-9208-df6a3a074c81', SBU_CRITICAL_CARE, 'iM3'),
    ('13c4ec7e-a49b-4e53-8591-6d4e32346b0e', '8ef39e20-ca2a-48e2-aa6b-1a75db8f61b1', 'df42d0dd-611d-41b3-9208-df6a3a074c81', SBU_CRITICAL_CARE, 'iM50'),
    ('608a8f89-a358-44d5-9603-ca09a2cdc209', '8ef39e20-ca2a-48e2-aa6b-1a75db8f61b1', 'df42d0dd-611d-41b3-9208-df6a3a074c81', SBU_CRITICAL_CARE, 'iM50 Nellcore'),
    ('fc522de6-359e-460d-9cfc-70310e0085c3', '8ef39e20-ca2a-48e2-aa6b-1a75db8f61b1', 'df42d0dd-611d-41b3-9208-df6a3a074c81', SBU_CRITICAL_CARE, 'iM70'),
    ('875dee5a-393d-41cd-af96-e20c092a2552', '8ef39e20-ca2a-48e2-aa6b-1a75db8f61b1', 'df42d0dd-611d-41b3-9208-df6a3a074c81', SBU_CRITICAL_CARE, 'iM8'),
    ('dada1cd1-8920-42a8-9596-83be454e95ee', '8ef39e20-ca2a-48e2-aa6b-1a75db8f61b1', 'df42d0dd-611d-41b3-9208-df6a3a074c81', SBU_CRITICAL_CARE, 'iX12'),
    ('db24205c-73d9-4f86-b8e8-b85d40c2e234', '8ef39e20-ca2a-48e2-aa6b-1a75db8f61b1', 'df42d0dd-611d-41b3-9208-df6a3a074c81', SBU_CRITICAL_CARE, 'iX12 With IBP'),
    ('677dcf79-ad00-4755-a85d-106883f16dd6', '8ef39e20-ca2a-48e2-aa6b-1a75db8f61b1', 'db094e92-444a-46c6-ae0b-96baae8f4a99', SBU_CRITICAL_CARE, 'H100B'),
    ('59fa5675-141b-4c28-9cf5-017495b00526', '8ef39e20-ca2a-48e2-aa6b-1a75db8f61b1', 'db094e92-444a-46c6-ae0b-96baae8f4a99', SBU_CRITICAL_CARE, 'M3A'),
    ('c3869fbc-6299-4e40-80a3-fe5630b7c98d', '8ef39e20-ca2a-48e2-aa6b-1a75db8f61b1', '6518d894-5d2c-4047-b8c8-245883c57d56', SBU_CRITICAL_CARE, 'M3A SpO2 NIBP'),
    ('c5ff52e4-7183-485c-ab9d-7012550317c1', '6de8e7d6-33cb-422b-9c63-56ac08d8d764', 'a6cd2ef7-b597-47c9-ad7c-d73af10b0ab7', SBU_CRITICAL_CARE, 'BREATHE - i'),
    ('e3d01664-569f-4854-b6cb-15ddc3a2eee4', 'c9b958cc-fa54-4eca-8b94-fa1ef409e377', '9a79fe1b-2ee9-4895-b5fa-24b7df9f2e15', SBU_CRITICAL_CARE, 'Boyils'),
    ('74d69a15-8f23-4e4a-a8b5-b438f03e064d', '172ad1df-1271-47ca-9d81-6fe8c519a2c9', '0f434784-05ff-4a0c-925f-1fb92f2089ba', SBU_CRITICAL_CARE, 'OxyMag'),
    ('dededa7e-29ba-4ded-8ac8-afc1b475e4ee', '172ad1df-1271-47ca-9d81-6fe8c519a2c9', '441f5a46-1306-4709-a904-e1b76b32a83c', SBU_CRITICAL_CARE, 'Fleximag Max'),
    ('63b6d1e7-a8fe-4d72-86f9-30b109deffd9', 'e2136571-1163-4183-a1ec-1d2c1aa5852a', '441f5a46-1306-4709-a904-e1b76b32a83c', SBU_CRITICAL_CARE, 'Servo i'),
    ('34030206-08b5-4976-8419-6305621060fa', '59bd2f79-c127-4778-ae8b-a95326d65739', 'de586d80-f06a-4f69-a1b4-2cf0aef79329', SBU_CRITICAL_CARE, 'IP-100'),
    ('b5fe155b-0d6d-4c8f-bbaf-d8f3930660a1', '59bd2f79-c127-4778-ae8b-a95326d65739', '6e7787be-ea1d-4c60-ba81-71db5f1d46a1', SBU_CRITICAL_CARE, 'SP101'),
    ('763f3393-0a3a-4466-a61b-be32e24f903d', 'c6b28947-8cdd-4ce5-94df-0862a64a007b', '3a1fc9d6-79ae-4ea7-aa85-fae437af7098', SBU_IMAGING, 'HD-550'),
    ('ac877187-d120-439e-a7bc-20b57a7c1c03', 'c6b28947-8cdd-4ce5-94df-0862a64a007b', '63e4017a-7e1c-4db1-a20a-f987a28d4b03', SBU_IMAGING, 'E2'),
    ('a203bdc3-9ba5-4d07-834f-de822f55868c', 'c6b28947-8cdd-4ce5-94df-0862a64a007b', 'f788f496-5670-4cdf-998e-5fa381834c03', SBU_IMAGING, 'P60 Exp'),
    ('bef12e5f-21bf-44cb-ab49-9d4b11ab9164', 'c6b28947-8cdd-4ce5-94df-0862a64a007b', 'f788f496-5670-4cdf-998e-5fa381834c03', SBU_IMAGING, 'S50 Elite'),
    ('cad58972-74ad-4496-9ee8-30f7659e6ae8', 'c6b28947-8cdd-4ce5-94df-0862a64a007b', 'f788f496-5670-4cdf-998e-5fa381834c03', SBU_IMAGING, 'S8 Exp'),
    ('c2d45b8d-221b-4adb-8589-5b6d90479376', 'c6b28947-8cdd-4ce5-94df-0862a64a007b', 'f788f496-5670-4cdf-998e-5fa381834c03', SBU_IMAGING, 'S80'),
    ('67a05ea5-5a52-4422-a70c-262c48db8f27', 'c6b28947-8cdd-4ce5-94df-0862a64a007b', 'f788f496-5670-4cdf-998e-5fa381834c03', SBU_IMAGING, 'X3'),
    ('a37aebdc-4b08-4b36-9dfc-fe44ef92b751', 'c6b28947-8cdd-4ce5-94df-0862a64a007b', '63e4017a-7e1c-4db1-a20a-f987a28d4b03', SBU_IMAGING, 'E1'),
    ('8943b25c-7269-4bc9-9dde-6cadc2b291f3', 'c6b28947-8cdd-4ce5-94df-0862a64a007b', '63e4017a-7e1c-4db1-a20a-f987a28d4b03', SBU_IMAGING, 'E1 EXP'),
    ('0cc4f5db-89c5-4b78-a3fa-71fec16d09d4', 'c6b28947-8cdd-4ce5-94df-0862a64a007b', '63e4017a-7e1c-4db1-a20a-f987a28d4b03', SBU_IMAGING, 'E10'),
    ('be559320-0274-472f-90a2-cccf28747bfc', 'c6b28947-8cdd-4ce5-94df-0862a64a007b', '63e4017a-7e1c-4db1-a20a-f987a28d4b03', SBU_IMAGING, 'E3'),
    ('eb9c039d-7cde-4fb2-acf7-f129302d4196', 'c6b28947-8cdd-4ce5-94df-0862a64a007b', 'f788f496-5670-4cdf-998e-5fa381834c03', SBU_IMAGING, 'P11elite'),
    ('10362fa5-7529-402c-865c-5f9d1f92934f', 'c6b28947-8cdd-4ce5-94df-0862a64a007b', 'f788f496-5670-4cdf-998e-5fa381834c03', SBU_IMAGING, 'P25 elite'),
    ('7559c12c-e2e2-4985-b669-89eb335a0707', 'c6b28947-8cdd-4ce5-94df-0862a64a007b', 'f788f496-5670-4cdf-998e-5fa381834c03', SBU_IMAGING, 'P25 elite CV'),
    ('1096b8b2-546e-4043-8e01-4e93dc84d33b', 'c6b28947-8cdd-4ce5-94df-0862a64a007b', 'f788f496-5670-4cdf-998e-5fa381834c03', SBU_IMAGING, 'P40elite'),
    ('8308cb8d-8a5e-4537-9517-7a40327fd619', 'c6b28947-8cdd-4ce5-94df-0862a64a007b', 'f788f496-5670-4cdf-998e-5fa381834c03', SBU_IMAGING, 'P9 elite'),
    ('cfdc8e48-f60c-450f-9c88-458e89d55b6e', 'c6b28947-8cdd-4ce5-94df-0862a64a007b', 'f788f496-5670-4cdf-998e-5fa381834c03', SBU_IMAGING, 'S11plus'),
    ('f1e3222a-a0ff-4bd6-832f-40aedbc7fd1a', 'c6b28947-8cdd-4ce5-94df-0862a64a007b', 'f788f496-5670-4cdf-998e-5fa381834c03', SBU_IMAGING, 'S70'),
    ('908a39ab-ca63-4b0b-8663-9cf666669435', '8ef39e20-ca2a-48e2-aa6b-1a75db8f61b1', '7fe4090b-0221-42b2-a46a-851b79ed0108', SBU_CRITICAL_CARE, 'F9'),
    ('86808779-3278-4cf6-9f94-fe2572282be7', '4a3ead75-882f-4e88-90d7-078351697f7e', 'b76b8956-f2c6-46e5-8956-eb707b4413e6', SBU_CRITICAL_CARE, 'Legacy / Unclassified Product'),
]

# (old_name_or_None, computed_name, model_id, sbu_id)
PRODUCTS = [
    ('Transnano B- Transport Incubator', 'AVI Health care Transnano Transport Incubator', '558a8e4c-2d82-4f6c-a5b8-5d1226655eaa', SBU_CRITICAL_CARE),
    ('Aeonmed 7200A Anesthesia Workstation', 'Aeonmed 7200A Anesthesia Workstation', 'c06b800d-11f3-4b2d-a975-de92beac86ce', SBU_CRITICAL_CARE),
    ('EDAN i15 Blood Gas', 'EDAN i15 Blood Gas Analyzer', '8ced100f-4e27-49f8-9fa5-1020a1df4dce', SBU_CRITICAL_CARE),
    ('Edan Colposcope', 'EDAN C6A-HD Colposcope', '6820f5dd-2c3e-4470-b2cb-875913ef90e6', SBU_CRITICAL_CARE),
    ('EDAN SE-1200 Express', 'EDAN SE-1200 Express ECG Machine', '2344effd-98fe-4dce-a335-4df2bf49807d', SBU_CRITICAL_CARE),
    ('EDAN SE-1202E', 'EDAN SE-1202E ECG Machine', '76cb8a6b-d567-4974-bba5-9fd2b6368d0e', SBU_CRITICAL_CARE),
    ('EDAN SE-310', 'EDAN SE-310 ECG Machine', 'f45e20bb-74b1-4903-83c1-920d8a172845', SBU_CRITICAL_CARE),
    ('Edan SE3 ECG Machine', 'EDAN SE3 ECG Machine', '8fc043af-3a2c-4fdc-81a9-9f604dfaed24', SBU_CRITICAL_CARE),
    ('EDAN SE-1515 SOFTWARE', 'EDAN SE- 1515 ECG Software', '6da69e64-2e57-4c12-9c9f-71e149ad9e5c', SBU_CRITICAL_CARE),
    ('Edan Sonotrax Fetal Doppler', 'EDAN Sonotrax Basic Fetal Doppler', '1ad539aa-1827-4687-8c77-df50da8b67b9', SBU_CRITICAL_CARE),
    ('EDAN F15 Series', 'EDAN F15 Maternal & Fetal Monitor', 'f311abae-0e69-41b7-94de-105bc088b5d4', SBU_CRITICAL_CARE),
    ('Edan F3', 'EDAN F3 Maternal & Fetal Monitor', 'b60b6e6e-8bfc-447c-8c35-601a09c48a8a', SBU_CRITICAL_CARE),
    ('Edan F6 CTG machine', 'EDAN F6 Maternal & Fetal Monitor', '434d450e-d806-4978-b6b9-4ccfe82821a9', SBU_CRITICAL_CARE),
    ('EDAN CX 10', 'EDAN CX 10 Patient Monitor', 'fc416528-fa96-4291-88f7-5da32a6dfc1e', SBU_CRITICAL_CARE),
    ('Edan CX12 Patient Monitor', 'EDAN CX12 Patient Monitor', '1cb278f9-42a9-413c-95ea-6fb5673895a9', SBU_CRITICAL_CARE),
    ('Edan iV6 Modular Monitor', 'EDAN IV6 Patient Monitor', 'cc344127-b24e-4feb-86bf-5efdd8ec6a86', SBU_CRITICAL_CARE),
    ('Edan iX12 with IBP&ETCO2', 'EDAN IX 12 With IBP & ETCO2 Patient Monitor', '9585887f-a4d1-4282-90b6-1d80b518ec0e', SBU_CRITICAL_CARE),
    ('Edan iX Monitor with nelcore Technology', 'EDAN IX Nelcore Patient Monitor', '23e50611-829c-43f4-a7a2-8d8b11dbd454', SBU_CRITICAL_CARE),
    ('EDAN X12', 'EDAN X12 Patient Monitor', '401eebca-991e-45b5-bcd5-d94307e765a9', SBU_CRITICAL_CARE),
    ('EDAN elite V5', 'EDAN elite V5 Patient Monitor', '63d9b107-3be0-46e8-93bd-abab947a9c8d', SBU_CRITICAL_CARE),
    ('EDAN elite V6', 'EDAN elite V6 Patient Monitor', 'ac29bef2-bdfd-4b5f-a917-6489272cd4d6', SBU_CRITICAL_CARE),
    ('EDAN elite V8', 'EDAN elite V8 Patient Monitor', 'b9db9ff0-9b98-4f9a-aa5d-57a65f21d6df', SBU_CRITICAL_CARE),
    ('EDAN iM20', 'EDAN iM20 Patient Monitor', '0134199d-fcfb-45ed-bb52-85dd48e8d507', SBU_CRITICAL_CARE),
    ('EDAN iM3', 'EDAN iM3 Patient Monitor', 'ee946df4-db64-4341-90ac-d7c438ec0dac', SBU_CRITICAL_CARE),
    ('EDAN iM50', 'EDAN iM50 Patient Monitor', '13c4ec7e-a49b-4e53-8591-6d4e32346b0e', SBU_CRITICAL_CARE),
    ('EDAN iM50 Nellcore', 'EDAN iM50 Nellcore Patient Monitor', '608a8f89-a358-44d5-9603-ca09a2cdc209', SBU_CRITICAL_CARE),
    ('EDAN iM70', 'EDAN iM70 Patient Monitor', 'fc522de6-359e-460d-9cfc-70310e0085c3', SBU_CRITICAL_CARE),
    ('EDAN iM8', 'EDAN iM8 Patient Monitor', '875dee5a-393d-41cd-af96-e20c092a2552', SBU_CRITICAL_CARE),
    ('Edan iX12 patient monitor', 'EDAN iX12 Patient Monitor', 'dada1cd1-8920-42a8-9596-83be454e95ee', SBU_CRITICAL_CARE),
    ('Edan iX12 With IBP Monitor', 'EDAN iX12 With IBP Patient Monitor', 'db24205c-73d9-4f86-b8e8-b85d40c2e234', SBU_CRITICAL_CARE),
    ('Edan H100B Pulseoxymeter', 'EDAN H100B Pulseoxymeter', '677dcf79-ad00-4755-a85d-106883f16dd6', SBU_CRITICAL_CARE),
    ('Edan M3A Pulseoxymeter', 'EDAN M3A Pulseoxymeter', '59fa5675-141b-4c28-9cf5-017495b00526', SBU_CRITICAL_CARE),
    ('Edan M3A SpO2 NIBP Monitor', 'EDAN M3A SpO2 NIBP Vital Signe Monitor', 'c3869fbc-6299-4e40-80a3-fe5630b7c98d', SBU_CRITICAL_CARE),
    ('BREATHE - i', 'ELECTROSCIENCE BREATHE - i Bubble CPAP & HFNC', 'c5ff52e4-7183-485c-ab9d-7012550317c1', SBU_CRITICAL_CARE),
    ('Anesthesia Machine Basic Boyils', 'Kolkatta Boyils Anesthesia Machine Basic', 'e3d01664-569f-4854-b6cb-15ddc3a2eee4', SBU_CRITICAL_CARE),
    ('Magnamed OxyMag', 'Magnamed OxyMag Transport Ventilator', '74d69a15-8f23-4e4a-a8b5-b438f03e064d', SBU_CRITICAL_CARE),
    ('Magnamed Fleximag Max', 'Magnamed Fleximag Max Ventilator', 'dededa7e-29ba-4ded-8ac8-afc1b475e4ee', SBU_CRITICAL_CARE),
    ('Maquet Servo i Ventilator', 'Maquet Servo i Ventilator', '63b6d1e7-a8fe-4d72-86f9-30b109deffd9', SBU_CRITICAL_CARE),
    ('Medion Infusion pump', 'Medion IP-100 Infusion Pump', '34030206-08b5-4976-8419-6305621060fa', SBU_CRITICAL_CARE),
    ('Medion Syringe pump', 'Medion SP101 Syringe Pump', 'b5fe155b-0d6d-4c8f-bbaf-d8f3930660a1', SBU_CRITICAL_CARE),
    ('SonoScape HD-550', 'SonoScape HD-550 Endoscopy', '763f3393-0a3a-4466-a61b-be32e24f903d', SBU_IMAGING),
    ('SonoScape E2', 'SonoScape E2 Portable USG Machine', 'ac877187-d120-439e-a7bc-20b57a7c1c03', SBU_IMAGING),
    ('SonoScape P60 Exp', 'SonoScape P60 Exp USG Machine', 'a203bdc3-9ba5-4d07-834f-de822f55868c', SBU_IMAGING),
    ('SonoScape S50 Elite', 'SonoScape S50 Elite USG Machine', 'bef12e5f-21bf-44cb-ab49-9d4b11ab9164', SBU_IMAGING),
    ('SonoScape S8 Exp', 'SonoScape S8 Exp USG Machine', 'cad58972-74ad-4496-9ee8-30f7659e6ae8', SBU_IMAGING),
    ('SonoScape S80', 'SonoScape S80 USG Machine', 'c2d45b8d-221b-4adb-8589-5b6d90479376', SBU_IMAGING),
    ('SonoScape X3', 'SonoScape X3 USG Machine', '67a05ea5-5a52-4422-a70c-262c48db8f27', SBU_IMAGING),
    ('Sonoscape E1', 'SonoScape E1 Portable USG Machine', 'a37aebdc-4b08-4b36-9dfc-fe44ef92b751', SBU_IMAGING),
    ('Sonoscape E1 EXP', 'SonoScape E1 EXP Portable USG Machine', '8943b25c-7269-4bc9-9dde-6cadc2b291f3', SBU_IMAGING),
    ('Sonoscape E10', 'SonoScape E10 Portable USG Machine', '0cc4f5db-89c5-4b78-a3fa-71fec16d09d4', SBU_IMAGING),
    ('Sonoscape E3', 'SonoScape E3 Portable USG Machine', 'be559320-0274-472f-90a2-cccf28747bfc', SBU_IMAGING),
    ('Sonoscape P11elite', 'SonoScape P11elite USG Machine', 'eb9c039d-7cde-4fb2-acf7-f129302d4196', SBU_IMAGING),
    ('Sonoscape P25 elite', 'SonoScape P25 elite USG Machine', '10362fa5-7529-402c-865c-5f9d1f92934f', SBU_IMAGING),
    ('Sonoscape P25 elite CV', 'SonoScape P25 elite CV USG Machine', '7559c12c-e2e2-4985-b669-89eb335a0707', SBU_IMAGING),
    ('Sonoscape P40elite', 'SonoScape P40elite USG Machine', '1096b8b2-546e-4043-8e01-4e93dc84d33b', SBU_IMAGING),
    ('Sonoscape P9elite', 'SonoScape P9 elite USG Machine', '8308cb8d-8a5e-4537-9517-7a40327fd619', SBU_IMAGING),
    ('Sonoscape S11plus', 'SonoScape S11plus USG Machine', 'cfdc8e48-f60c-450f-9c88-458e89d55b6e', SBU_IMAGING),
    ('Sonoscape S70', 'SonoScape S70 USG Machine', 'f1e3222a-a0ff-4bd6-832f-40aedbc7fd1a', SBU_IMAGING),
    (None, 'EDAN F9 Maternal & Fetal Monitor', '908a39ab-ca63-4b0b-8663-9cf666669435', SBU_CRITICAL_CARE),
]

LEGACY_MODEL_ID = "86808779-3278-4cf6-9f94-fe2572282be7"


def upgrade() -> None:
    bind = op.get_bind()

    op.add_column("product", sa.Column("brand_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column("product", sa.Column("model_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column("product", sa.Column("category_id", postgresql.UUID(as_uuid=True), nullable=True))

    for id_, sbu_id, name in BRANDS:
        bind.execute(
            text("INSERT INTO brand (id, sbu_id, name) VALUES (:id, :sbu_id, :name)"),
            {"id": id_, "sbu_id": sbu_id, "name": name},
        )
    for id_, sbu_id, name in CATEGORIES:
        bind.execute(
            text("INSERT INTO category (id, sbu_id, name) VALUES (:id, :sbu_id, :name)"),
            {"id": id_, "sbu_id": sbu_id, "name": name},
        )
    for id_, brand_id, category_id, sbu_id, name in MODELS:
        bind.execute(
            text(
                "INSERT INTO model (id, brand_id, category_id, sbu_id, name) "
                "VALUES (:id, :brand_id, :category_id, :sbu_id, :name)"
            ),
            {"id": id_, "brand_id": brand_id, "category_id": category_id, "sbu_id": sbu_id, "name": name},
        )

    for old_name, computed_name, model_id, sbu_id in PRODUCTS:
        updated = 0
        if old_name is not None:
            result = bind.execute(
                text(
                    "UPDATE product SET brand_id = (SELECT brand_id FROM model WHERE id = :model_id), "
                    "model_id = :model_id, "
                    "category_id = (SELECT category_id FROM model WHERE id = :model_id), "
                    "name = :computed_name, is_active = true "
                    "WHERE name = :old_name"
                ),
                {"model_id": model_id, "computed_name": computed_name, "old_name": old_name},
            )
            updated = result.rowcount
        if updated == 0:
            bind.execute(
                text(
                    "INSERT INTO product (id, sbu_id, brand_id, model_id, category_id, name, product_type, is_active) "
                    "SELECT gen_random_uuid(), :sbu_id, "
                    "(SELECT brand_id FROM model WHERE id = :model_id), :model_id, "
                    "(SELECT category_id FROM model WHERE id = :model_id), :computed_name, "
                    "'NEW_EQUIPMENT', true "
                    "WHERE NOT EXISTS (SELECT 1 FROM product WHERE name = :computed_name)"
                ),
                {"sbu_id": sbu_id, "model_id": model_id, "computed_name": computed_name},
            )

    # Retire every product this backfill didn't touch (model_id still NULL):
    # delete if nothing references it, else deactivate + point at the Legacy
    # Data landing spot so the NOT NULL constraint below still applies.
    bind.execute(
        text(
            "DELETE FROM product WHERE model_id IS NULL "
            "AND NOT EXISTS (SELECT 1 FROM opportunity_item WHERE product_id = product.id) "
            "AND NOT EXISTS (SELECT 1 FROM installed_asset WHERE product_id = product.id) "
            "AND NOT EXISTS (SELECT 1 FROM document WHERE product_id = product.id) "
            "AND NOT EXISTS (SELECT 1 FROM marketing_lead WHERE product_id = product.id)"
        )
    )
    bind.execute(
        text(
            "UPDATE product SET "
            "brand_id = (SELECT brand_id FROM model WHERE id = :legacy_model_id), "
            "model_id = :legacy_model_id, "
            "category_id = (SELECT category_id FROM model WHERE id = :legacy_model_id), "
            "is_active = false "
            "WHERE model_id IS NULL"
        ),
        {"legacy_model_id": LEGACY_MODEL_ID},
    )

    op.alter_column("product", "brand_id", nullable=False)
    op.alter_column("product", "model_id", nullable=False)
    op.alter_column("product", "category_id", nullable=False)
    op.create_foreign_key("product_brand_id_fkey", "product", "brand", ["brand_id"], ["id"])
    op.create_foreign_key("product_model_id_fkey", "product", "model", ["model_id"], ["id"])
    op.create_foreign_key("product_category_id_fkey", "product", "category", ["category_id"], ["id"])

    op.drop_column("product", "oem_name")
    op.drop_column("product", "model_number")
    op.drop_column("product", "category_name")

    op.execute(
        """
        CREATE FUNCTION trg_product_sync_brand_category_name_fn() RETURNS trigger
            LANGUAGE plpgsql
        AS $$
        BEGIN
            NEW.brand_id := (SELECT brand_id FROM model WHERE id = NEW.model_id);
            NEW.category_id := (SELECT category_id FROM model WHERE id = NEW.model_id);
            NEW.name := (
                SELECT b.name || ' ' || m.name || ' ' || c.name
                FROM model m JOIN brand b ON b.id = m.brand_id
                             JOIN category c ON c.id = m.category_id
                WHERE m.id = NEW.model_id
            );
            RETURN NEW;
        END;
        $$;
        """
    )
    op.execute(
        "CREATE TRIGGER trg_product_sync_brand_category_name BEFORE INSERT OR UPDATE OF model_id ON product "
        "FOR EACH ROW EXECUTE FUNCTION trg_product_sync_brand_category_name_fn();"
    )


def downgrade() -> None:
    """Structural rollback only -- does NOT restore the pre-cutover
    oem_name/model_number/category_name free-text values. Once this
    migration's forward pass has run, those original strings are gone;
    downgrading re-adds the columns empty (NULL), it does not repopulate
    them from brand/model/category."""
    op.execute("DROP TRIGGER IF EXISTS trg_product_sync_brand_category_name ON product;")
    op.execute("DROP FUNCTION IF EXISTS trg_product_sync_brand_category_name_fn();")

    op.add_column("product", sa.Column("oem_name", sa.String(255), nullable=True))
    op.add_column("product", sa.Column("model_number", sa.String(100), nullable=True))
    op.add_column("product", sa.Column("category_name", sa.String(100), nullable=True))

    op.drop_constraint("product_brand_id_fkey", "product", type_="foreignkey")
    op.drop_constraint("product_model_id_fkey", "product", type_="foreignkey")
    op.drop_constraint("product_category_id_fkey", "product", type_="foreignkey")
    op.drop_column("product", "brand_id")
    op.drop_column("product", "model_id")
    op.drop_column("product", "category_id")

