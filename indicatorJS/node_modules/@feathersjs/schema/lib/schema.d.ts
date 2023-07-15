import Ajv, { AsyncValidateFunction, ValidateFunction } from 'ajv';
import { FromSchema, JSONSchema } from 'json-schema-to-ts';
export declare const DEFAULT_AJV: Ajv;
export { Ajv };
/**
 * A validation function that takes data and returns the (possibly coerced)
 * data or throws a validation error.
 */
export type Validator<T = any, R = T> = (data: T) => Promise<R>;
export type JSONSchemaDefinition = JSONSchema & {
    $id: string;
    $async?: true;
    properties?: {
        [key: string]: JSONSchema;
    };
    required?: readonly string[];
};
export interface Schema<T> {
    validate<X = T>(...args: Parameters<ValidateFunction<X>>): Promise<X>;
}
export declare class SchemaWrapper<S extends JSONSchemaDefinition> implements Schema<FromSchema<S>> {
    definition: S;
    ajv: Ajv;
    validator: AsyncValidateFunction;
    readonly _type: FromSchema<S>;
    constructor(definition: S, ajv?: Ajv);
    get properties(): S["properties"];
    get required(): S["required"];
    validate<T = FromSchema<S>>(...args: Parameters<ValidateFunction<T>>): Promise<T>;
    toJSON(): S;
}
export declare function schema<S extends JSONSchemaDefinition>(definition: S, ajv?: Ajv): SchemaWrapper<S>;
