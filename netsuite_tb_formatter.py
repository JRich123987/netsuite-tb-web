import pandas as pd

def format_netsuite_tb(input_path: str, output_path: str) -> None:
    """
    Reads a NetSuite Trial Balance file, fills down subsidiary names,
    calculates totals, and saves the formatted version.
    """
    df = pd.read_excel(input_path, sheet_name=0, header=None)

    # Locate the header row containing 'Account'
    header_row_idx = df[df.apply(lambda row: row.astype(str).str.contains('Account').any(), axis=1)].index[0]
    df.columns = df.iloc[header_row_idx]
    df = df.drop(index=range(header_row_idx + 1))
    df.reset_index(drop=True, inplace=True)

    # Fill down subsidiary names
    subsidiary_col = df.columns[0]
    df[subsidiary_col] = df[subsidiary_col].fillna(method='ffill')

    # Calculate Total = Debit - Credit
    debit_col = [col for col in df.columns if str(col).strip().lower() == 'debit']
    credit_col = [col for col in df.columns if str(col).strip().lower() == 'credit']

    if debit_col and credit_col:
        df['Total'] = df[debit_col[0]].fillna(0) - df[credit_col[0]].fillna(0)

    # Save formatted file
    df.to_excel(output_path, index=False)

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Format NetSuite TB file.")
    parser.add_argument("--input", required=True, help="Input Excel file path")
    parser.add_argument("--output", required=True, help="Output Excel file path")
    args = parser.parse_args()

    format_netsuite_tb(args.input, args.output)
