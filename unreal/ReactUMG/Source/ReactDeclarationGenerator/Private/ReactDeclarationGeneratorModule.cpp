#include "Features/IModularFeatures.h"
#include "IReactDeclarationGenerator.h"

class FReactDeclarationGeneratorModule : public IReactDeclarationGenerator
{
private:
public:
    void StartupModule() override
    {
    }

    void ShutdownModule() override
    {
    }
};

IMPLEMENT_MODULE(FReactDeclarationGeneratorModule, ReactDeclarationGenerator)