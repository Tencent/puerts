#pragma once


typedef void(*FuncPtr)(void);

void JSENV_API SetFunctionArray(FuncPtr *FuncArray, uint32_t FuncArrayLength);

