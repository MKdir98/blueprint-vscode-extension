#!/usr/bin/env node
import arg from 'arg';
import { UIProvider } from './UIProvider';
declare const argSpec: {};
export type Args = arg.Result<typeof argSpec>;
export type Runner = (args: Args, ui: UIProvider) => Promise<void>;
export {};
