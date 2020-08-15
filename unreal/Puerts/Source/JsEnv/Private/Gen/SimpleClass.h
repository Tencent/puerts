#pragma once

struct SimpleClass
{
    // SimpleClass(int64 In = 0): m_i64(In) { }    // TODO - 需支持默认参数
    SimpleClass();
    
    /*
     * 测试dtor的效果（持有某个对象B的指针，每当dtor被调用时，往B的计数器+1）。测试时调用析构后，检查B的计数器是否如期+1
     */
    ~SimpleClass();

    int64 GetData();

    void SetData(int64 In);

    int64 m_i64;

    static void ResetDtorCount();

    static uint32 GetDtorCount();
    
    static uint32 m_dtor_count;
};
