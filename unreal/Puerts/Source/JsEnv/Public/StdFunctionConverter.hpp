template <typename R, typename... Args>
struct Converter<std::function<R(Args...)>>
{
    static API::ValueType toScript(API::ContextType context, std::function<R(Args...)> value)
    {
        return API::GetUndefined(context);
    }

    static std::function<R(Args...)> toCpp(API::ContextType context, const API::ValueType value)
    {
        if (API::IsNullOrUndefined(context, value))
            return nullptr;
        Function PF(context, value);
        return [=](Args... cppArgs) -> R { return PF.Func<R>(cppArgs...); };
    }

    static bool accept(API::ContextType context, const API::ValueType value)
    {
        return API::IsNullOrUndefined(context, value) || Converter<Function>::accept(context, value);
    }
};

template <typename... Args>
struct Converter<std::function<void(Args...)>>
{
    static API::ValueType toScript(API::ContextType context, std::function<void(Args...)> value)
    {
        return API::GetUndefined(context);
    }

    static std::function<void(Args...)> toCpp(API::ContextType context, const API::ValueType value)
    {
        if (API::IsNullOrUndefined(context, value))
            return nullptr;
        Function PF(context, value);
        return [=](Args... cppArgs) -> void { PF.Action(cppArgs...); };
    }

    static bool accept(API::ContextType context, const API::ValueType value)
    {
        return API::IsNullOrUndefined(context, value) || Converter<Function>::accept(context, value);
    }
};
