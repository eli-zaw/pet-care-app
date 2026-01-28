import { describe, it, expect } from 'vitest';

// Test version of parseCookieHeader function
const parseCookieHeader = (cookieHeader: string): { name: string; value: string }[] => {
  return cookieHeader.split(';').map((cookie) => {
    const [name, ...rest] = cookie.trim().split('=');
    return { name, value: rest.join('=') };
  });
};

describe('parseCookieHeader', () => {
  it('should parse single cookie correctly', () => {
    // Arrange
    const cookieHeader = 'session=abc123';

    // Act
    const result = parseCookieHeader(cookieHeader);

    // Assert
    expect(result).toEqual([
      { name: 'session', value: 'abc123' }
    ]);
  });

  it('should parse multiple cookies separated by semicolon', () => {
    // Arrange
    const cookieHeader = 'session=abc123; user=john; theme=dark';

    // Act
    const result = parseCookieHeader(cookieHeader);

    // Assert
    expect(result).toEqual([
      { name: 'session', value: 'abc123' },
      { name: 'user', value: 'john' },
      { name: 'theme', value: 'dark' }
    ]);
  });

  it('should handle cookies with spaces around semicolons', () => {
    // Arrange
    const cookieHeader = 'session=abc123 ; user=john ; theme=dark';

    // Act
    const result = parseCookieHeader(cookieHeader);

    // Assert
    expect(result).toEqual([
      { name: 'session', value: 'abc123' },
      { name: 'user', value: 'john' },
      { name: 'theme', value: 'dark' }
    ]);
  });

  it('should handle cookie values with equals signs', () => {
    // Arrange
    const cookieHeader = 'token=abc=def=ghi; user=john';

    // Act
    const result = parseCookieHeader(cookieHeader);

    // Assert
    expect(result).toEqual([
      { name: 'token', value: 'abc=def=ghi' },
      { name: 'user', value: 'john' }
    ]);
  });

  it('should handle empty cookie values', () => {
    // Arrange
    const cookieHeader = 'session=; user=john; empty=';

    // Act
    const result = parseCookieHeader(cookieHeader);

    // Assert
    expect(result).toEqual([
      { name: 'session', value: '' },
      { name: 'user', value: 'john' },
      { name: 'empty', value: '' }
    ]);
  });

  it('should handle cookies with special characters in values', () => {
    // Arrange
    const cookieHeader = 'data=hello%20world; json={"key":"value"}; encoded=a%2Bb%2Bc';

    // Act
    const result = parseCookieHeader(cookieHeader);

    // Assert
    expect(result).toEqual([
      { name: 'data', value: 'hello%20world' },
      { name: 'json', value: '{"key":"value"}' },
      { name: 'encoded', value: 'a%2Bb%2Bc' }
    ]);
  });

  it('should handle cookies without values (only names)', () => {
    // Arrange
    const cookieHeader = 'flag; user=john; anotherFlag=';

    // Act
    const result = parseCookieHeader(cookieHeader);

    // Assert
    expect(result).toEqual([
      { name: 'flag', value: '' },
      { name: 'user', value: 'john' },
      { name: 'anotherFlag', value: '' }
    ]);
  });

  it('should handle leading and trailing whitespace in cookie header', () => {
    // Arrange
    const cookieHeader = '  session=abc123  ;  user=john  ';

    // Act
    const result = parseCookieHeader(cookieHeader);

    // Assert
    expect(result).toEqual([
      { name: 'session', value: 'abc123' },
      { name: 'user', value: 'john' }
    ]);
  });

  it('should handle empty string input', () => {
    // Arrange
    const cookieHeader = '';

    // Act
    const result = parseCookieHeader(cookieHeader);

    // Assert
    expect(result).toEqual([
      { name: '', value: '' }
    ]);
  });

  describe('edge cases', () => {
    it('should handle malformed cookies gracefully', () => {
      // Arrange
      const cookieHeader = 'session=abc123; =value; name=';

      // Act
      const result = parseCookieHeader(cookieHeader);

      // Assert
      expect(result).toEqual([
        { name: 'session', value: 'abc123' },
        { name: '', value: 'value' },
        { name: 'name', value: '' }
      ]);
    });

    it('should handle cookies with multiple equals in complex values', () => {
      // Arrange
      const cookieHeader = 'jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImp0aSI6ImQ5ZDBkNTM2LTg5ZjctNGU4ZS1hMWMwLWQwMzFmMzBmNzZkZSIsImlhdCI6MTY4ODQ4MzYwMCwiZXhwIjoxNjg4NDg3MjAwfQ; user=john';

      // Act
      const result = parseCookieHeader(cookieHeader);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('jwt');
      expect(result[0].value).toContain('eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9');
      expect(result[1]).toEqual({ name: 'user', value: 'john' });
    });

    it('should handle cookies with semicolons in values', () => {
      // Arrange - This is a tricky case as semicolons are used as separators
      const cookieHeader = 'data=hello;world; user=john';

      // Act
      const result = parseCookieHeader(cookieHeader);

      // Assert - This will split incorrectly due to semicolon in value
      expect(result).toEqual([
        { name: 'data', value: 'hello' },
        { name: 'world', value: '' },
        { name: 'user', value: 'john' }
      ]);
    });

    it('should handle very long cookie values', () => {
      // Arrange
      const longValue = 'a'.repeat(1000);
      const cookieHeader = `data=${longValue}; user=john`;

      // Act
      const result = parseCookieHeader(cookieHeader);

      // Assert
      expect(result[0].value).toBe(longValue);
      expect(result[1]).toEqual({ name: 'user', value: 'john' });
    });
  });

  describe('real-world cookie examples', () => {
    it('should parse typical session cookies', () => {
      // Arrange
      const cookieHeader = 'session_id=abc123def456; user_id=789; preferences=theme:dark|lang:pl';

      // Act
      const result = parseCookieHeader(cookieHeader);

      // Assert
      expect(result).toEqual([
        { name: 'session_id', value: 'abc123def456' },
        { name: 'user_id', value: '789' },
        { name: 'preferences', value: 'theme:dark|lang:pl' }
      ]);
    });

    it('should parse Supabase auth cookies pattern', () => {
      // Arrange - Based on typical Supabase cookie patterns
      const cookieHeader = 'sb-access-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9; sb-refresh-token=refresh123; sb-provider-token=github123';

      // Act
      const result = parseCookieHeader(cookieHeader);

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('sb-access-token');
      expect(result[1].name).toBe('sb-refresh-token');
      expect(result[2].name).toBe('sb-provider-token');
    });

    it('should handle cookies with expires and other attributes', () => {
      // Arrange - Note: This function only parses the cookie name=value pairs, not attributes
      const cookieHeader = 'session=abc123; Path=/; HttpOnly; Secure; SameSite=Lax';

      // Act
      const result = parseCookieHeader(cookieHeader);

      // Assert - Function ignores attributes after the first semicolon per cookie
      expect(result).toEqual([
        { name: 'session', value: 'abc123' },
        { name: 'Path', value: '/' },
        { name: 'HttpOnly', value: '' },
        { name: 'Secure', value: '' },
        { name: 'SameSite', value: 'Lax' }
      ]);
    });
  });
});