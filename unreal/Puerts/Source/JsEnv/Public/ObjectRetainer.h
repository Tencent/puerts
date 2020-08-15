#pragma once

#include "CoreMinimal.h"
#include "UObject/GCObject.h"

namespace puerts
{
class JSENV_API FObjectRetainer : public FGCObject
{
public:
    void Retain(UObject* Object);

    void Release(UObject* Object);

    void Clear();

    void AddReferencedObjects(FReferenceCollector& Collector) override;

    ~FObjectRetainer();

private:
    struct ObjectInfo
    {
        int32 Refcount;
    };

    TSet<UObject*> RetainedObjects;

};
}