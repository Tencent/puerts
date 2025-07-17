-- Lua configuration file
local config = {
    -- Application settings
    app = {
        name = "LuaTestApp",
        version = "1.0.0",
        debug = true
    },
    
    -- Database settings
    database = {
        host = "localhost",
        port = 3306,
        username = "testuser",
        password = "testpass",
        database = "testdb"
    },
    
    -- Network settings
    network = {
        port = 8080,
        maxConnections = 100,
        timeout = 30
    },
    
    -- Logging settings
    logging = {
        level = "INFO",
        file = "app.log",
        maxSize = 1024 * 1024,  -- 1MB
        backupCount = 5
    },
    
    -- Cache settings
    cache = {
        enabled = true,
        maxSize = 1000,
        ttl = 3600  -- 1 hour
    },
    
    -- Security settings
    security = {
        enableSSL = true,
        certificatePath = "/path/to/cert.pem",
        keyPath = "/path/to/key.pem"
    }
}

-- Function to get configuration value
function config.get(path)
    local keys = {}
    for key in string.gmatch(path, "[^%.]+") do
        table.insert(keys, key)
    end
    
    local current = config
    for _, key in ipairs(keys) do
        if type(current) == "table" and current[key] ~= nil then
            current = current[key]
        else
            return nil
        end
    end
    
    return current
end

-- Function to set configuration value
function config.set(path, value)
    local keys = {}
    for key in string.gmatch(path, "[^%.]+") do
        table.insert(keys, key)
    end
    
    local current = config
    for i = 1, #keys - 1 do
        local key = keys[i]
        if current[key] == nil then
            current[key] = {}
        elseif type(current[key]) ~= "table" then
            return false
        end
        current = current[key]
    end
    
    current[keys[#keys]] = value
    return true
end

-- Function to validate configuration
function config.validate()
    local errors = {}
    
    -- Validate required configuration items
    if not config.app.name then
        table.insert(errors, "app.name is required")
    end
    
    if not config.database.host then
        table.insert(errors, "database.host is required")
    end
    
    if not config.database.port or type(config.database.port) ~= "number" then
        table.insert(errors, "database.port must be a number")
    end
    
    if not config.network.port or type(config.network.port) ~= "number" then
        table.insert(errors, "network.port must be a number")
    end
    
    return #errors == 0, errors
end

-- Export configuration
return config 