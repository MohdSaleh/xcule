export declare function compareNSB(a: any, b: any): 1 | -1 | 0;
export declare function compareArrays(a: any[], b: any[]): 1 | -1 | 0;
export declare function compare(a: any, b: any, compareStrings?: any): 0 | 1 | -1;
export declare function sorter($sort: {
    [key: string]: -1 | 1;
}): (a: any, b: any) => number;
