function cleanProxyLine(line) {
    if (!line) return null;
    let cleaned = line.trim();
    
    cleaned = cleaned.replace(/^socks4:\/\//i, '');
    cleaned = cleaned.replace(/^socks5:\/\//i, '');
    cleaned = cleaned.replace(/^http:\/\//i, '');
    cleaned = cleaned.replace(/^https:\/\//i, '');
    
    if (cleaned.includes(':')) {
        return cleaned;
    }
    return null;
}

module.exports = { cleanProxyLine };
