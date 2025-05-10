
interface NpiAddress {
  country_code: string;
  country_name: string;
  address_purpose: string;
  address_type: string;
  address_1: string;
  address_2?: string;
  city: string;
  state: string;
  postal_code: string;
  telephone_number?: string;
  fax_number?: string;
}

interface NpiTaxonomy {
  code: string;
  taxonomy_group?: string;
  desc: string;
  state?: string;
  license?: string;
  primary: boolean;
}

interface NpiBasic {
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  credential?: string;
  sole_proprietor?: string;
  gender?: string;
  enumeration_date: string;
  last_updated: string;
  status: string;
  name_prefix?: string;
  organization_name?: string; // For organizations
  organizational_subpart?: string;
}

interface NpiResult {
  enumeration_type: 'NPI-1' | 'NPI-2'; // NPI-1 for individuals, NPI-2 for organizations
  number: string; // NPI number
  basic: NpiBasic;
  addresses: NpiAddress[];
  taxonomies: NpiTaxonomy[];
  identifiers: Array<{
    identifier: string;
    code: string;
    desc?: string;
    state?: string;
    issuer?: string;
  }>;
  other_names: Array<{
    type: string;
    code: string;
    organization_name?: string;
    first_name?: string;
    last_name?: string;
  }>;
}

export interface NpiRegistryResponse {
  result_count: number;
  results: NpiResult[];
}

export interface ProviderAddress {
    address_1: string;
    address_2?: string;
    city: string;
    state: string;
    postal_code: string;
    country_code: string;
    telephone_number?: string;
}

export interface ProviderData {
  name: string;
  firstName?: string;
  lastName?: string;
  orgName?: string;
  address?: ProviderAddress;
  taxonomy?: string;
}
