
#include "SimpleClass.h"

SimpleClass::SimpleClass(): m_i64(0) { }

SimpleClass::~SimpleClass() { ++m_dtor_count; }

int64 SimpleClass::GetData() { return m_i64; }

void SimpleClass::SetData(int64 In) { m_i64 = In; }

void SimpleClass::ResetDtorCount() { m_dtor_count = 0; }

uint32 SimpleClass::GetDtorCount() { return m_dtor_count; }

uint32 SimpleClass::m_dtor_count = 0;
