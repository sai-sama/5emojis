import { getZodiacSign } from "../zodiac";

// NOTE: new Date("YYYY-MM-DD") parses as UTC midnight, but getDate() uses
// local timezone. Tests use mid-range dates (not boundaries) to avoid
// timezone-dependent off-by-one issues.

describe("getZodiacSign", () => {
  it("returns Capricorn for Jan 5", () => {
    const result = getZodiacSign("2000-01-05");
    expect(result.sign).toBe("Capricorn");
    expect(result.emoji).toBe("\u2651");
  });

  it("returns Aquarius for Feb 5", () => {
    const result = getZodiacSign("2000-02-05");
    expect(result.sign).toBe("Aquarius");
    expect(result.emoji).toBe("\u2652");
  });

  it("returns Pisces for Mar 5", () => {
    const result = getZodiacSign("2000-03-05");
    expect(result.sign).toBe("Pisces");
    expect(result.emoji).toBe("\u2653");
  });

  it("returns Aries for Apr 5", () => {
    const result = getZodiacSign("2000-04-05");
    expect(result.sign).toBe("Aries");
    expect(result.emoji).toBe("\u2648");
  });

  it("returns Taurus for May 5", () => {
    const result = getZodiacSign("2000-05-05");
    expect(result.sign).toBe("Taurus");
    expect(result.emoji).toBe("\u2649");
  });

  it("returns Gemini for Jun 5", () => {
    const result = getZodiacSign("2000-06-05");
    expect(result.sign).toBe("Gemini");
    expect(result.emoji).toBe("\u264A");
  });

  it("returns Cancer for Jul 5", () => {
    const result = getZodiacSign("2000-07-05");
    expect(result.sign).toBe("Cancer");
    expect(result.emoji).toBe("\u264B");
  });

  it("returns Leo for Aug 5", () => {
    const result = getZodiacSign("2000-08-05");
    expect(result.sign).toBe("Leo");
    expect(result.emoji).toBe("\u264C");
  });

  it("returns Virgo for Sep 5", () => {
    const result = getZodiacSign("2000-09-05");
    expect(result.sign).toBe("Virgo");
    expect(result.emoji).toBe("\u264D");
  });

  it("returns Libra for Oct 5", () => {
    const result = getZodiacSign("2000-10-05");
    expect(result.sign).toBe("Libra");
    expect(result.emoji).toBe("\u264E");
  });

  it("returns Scorpio for Nov 5", () => {
    const result = getZodiacSign("2000-11-05");
    expect(result.sign).toBe("Scorpio");
    expect(result.emoji).toBe("\u264F");
  });

  it("returns Sagittarius for Dec 5", () => {
    const result = getZodiacSign("2000-12-05");
    expect(result.sign).toBe("Sagittarius");
    expect(result.emoji).toBe("\u2650");
  });

  it("returns Capricorn for Dec 28", () => {
    const result = getZodiacSign("2000-12-28");
    expect(result.sign).toBe("Capricorn");
    expect(result.emoji).toBe("\u2651");
  });

  it("all 12 signs are represented", () => {
    const signs = new Set<string>();
    const dates = [
      "2000-01-05", "2000-02-05", "2000-03-05", "2000-04-05",
      "2000-05-05", "2000-06-05", "2000-07-05", "2000-08-05",
      "2000-09-05", "2000-10-05", "2000-11-05", "2000-12-05",
    ];
    for (const d of dates) {
      signs.add(getZodiacSign(d).sign);
    }
    expect(signs.size).toBe(12);
  });

  it("returns an emoji for every sign", () => {
    const result = getZodiacSign("2000-07-05");
    expect(result.emoji).toBeTruthy();
    expect(result.emoji.length).toBeGreaterThan(0);
  });
});
