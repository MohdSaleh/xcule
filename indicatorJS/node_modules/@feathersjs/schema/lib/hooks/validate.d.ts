import { HookContext, NextFunction } from '@feathersjs/feathers';
import { Schema, Validator } from '../schema';
import { DataValidatorMap } from '../json-schema';
export declare const validateQuery: <H extends HookContext<import("@feathersjs/feathers").Application<any, any>, any>>(schema: Schema<any> | Validator) => (context: H, next?: NextFunction) => Promise<any>;
export declare const validateData: <H extends HookContext<import("@feathersjs/feathers").Application<any, any>, any>>(schema: Schema<any> | DataValidatorMap | Validator) => (context: H, next?: NextFunction) => Promise<any>;
