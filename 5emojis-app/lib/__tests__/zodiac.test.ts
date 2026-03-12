import { getZodiacSign } from "../zodiac";

describe("getZodiacSign", () => {
  // ─── Basic sign detection (mid-range dates) ──────────────
  it("returns Capricorn for Jan 5", () => {
    expect(getZodiacSign("2000-01-05")).toEqual({ sign: "Capricorn", emoji: "♑" });
  });

  it("returns Aquarius for Feb 5", () => {
    expect(getZodiacSign("2000-02-05")).toEqual({ sign: "Aquarius", emoji: "♒" });
  });

  it("returns Pisces for Mar 5", () => {
    expect(getZodiacSign("2000-03-05")).toEqual({ sign: "Pisces", emoji: "♓" });
  });

  it("returns Aries for Apr 5", () => {
    expect(getZodiacSign("2000-04-05")).toEqual({ sign: "Aries", emoji: "♈" });
  });

  it("returns Taurus for May 5", () => {
    expect(getZodiacSign("2000-05-05")).toEqual({ sign: "Taurus", emoji: "♉" });
  });

  it("returns Gemini for Jun 5", () => {
    expect(getZodiacSign("2000-06-05")).toEqual({ sign: "Gemini", emoji: "♊" });
  });

  it("returns Cancer for Jul 5", () => {
    expect(getZodiacSign("2000-07-05")).toEqual({ sign: "Cancer", emoji: "♋" });
  });

  it("returns Leo for Aug 5", () => {
    expect(getZodiacSign("2000-08-05")).toEqual({ sign: "Leo", emoji: "♌" });
  });

  it("returns Virgo for Sep 5", () => {
    expect(getZodiacSign("2000-09-05")).toEqual({ sign: "Virgo", emoji: "♍" });
  });

  it("returns Libra for Oct 5", () => {
    expect(getZodiacSign("2000-10-05")).toEqual({ sign: "Libra", emoji: "♎" });
  });

  it("returns Scorpio for Nov 5", () => {
    expect(getZodiacSign("2000-11-05")).toEqual({ sign: "Scorpio", emoji: "♏" });
  });

  it("returns Sagittarius for Dec 5", () => {
    expect(getZodiacSign("2000-12-05")).toEqual({ sign: "Sagittarius", emoji: "♐" });
  });

  it("returns Capricorn for Dec 28", () => {
    expect(getZodiacSign("2000-12-28")).toEqual({ sign: "Capricorn", emoji: "♑" });
  });

  it("all 12 signs are represented", () => {
    const signs = new Set<string>();
    const dates = [
      "2000-01-05", "2000-02-05", "2000-03-05", "2000-04-05",
      "2000-05-05", "2000-06-05", "2000-07-05", "2000-08-05",
      "2000-09-05", "2000-10-05", "2000-11-05", "2000-12-05",
    ];
    for (const d of dates) signs.add(getZodiacSign(d).sign);
    expect(signs.size).toBe(12);
  });

  // ─── Boundary dates (the cusp days) ──────────────────────
  // These are the exact dates where the old timezone bug caused wrong results
  describe("boundary/cusp dates", () => {
    it("Jan 19 is Capricorn (last day)", () => {
      expect(getZodiacSign("2000-01-19").sign).toBe("Capricorn");
    });

    it("Jan 20 is Aquarius (first day)", () => {
      expect(getZodiacSign("2000-01-20").sign).toBe("Aquarius");
    });

    it("Feb 18 is Aquarius (last day)", () => {
      expect(getZodiacSign("2000-02-18").sign).toBe("Aquarius");
    });

    it("Feb 19 is Pisces (first day)", () => {
      expect(getZodiacSign("2000-02-19").sign).toBe("Pisces");
    });

    it("Mar 20 is Pisces (last day)", () => {
      expect(getZodiacSign("2000-03-20").sign).toBe("Pisces");
    });

    it("Mar 21 is Aries (first day)", () => {
      expect(getZodiacSign("2000-03-21").sign).toBe("Aries");
    });

    it("Dec 21 is Sagittarius (last day)", () => {
      expect(getZodiacSign("2000-12-21").sign).toBe("Sagittarius");
    });

    it("Dec 22 is Capricorn (first day)", () => {
      expect(getZodiacSign("2000-12-22").sign).toBe("Capricorn");
    });

    it("Dec 31 is Capricorn (last day of year)", () => {
      expect(getZodiacSign("2000-12-31").sign).toBe("Capricorn");
    });

    it("Jan 1 is Capricorn (first day of year)", () => {
      expect(getZodiacSign("2000-01-01").sign).toBe("Capricorn");
    });
  });

  // ─── Timezone independence ───────────────────────────────
  // The old implementation used new Date(dob).getMonth()/getDate() which shifted
  // dates in negative UTC offsets. Direct string parsing fixes this.
  describe("timezone independence", () => {
    it("Jan 20 is always Aquarius (not Capricorn from timezone shift)", () => {
      expect(getZodiacSign("2000-01-20").sign).toBe("Aquarius");
    });

    it("handles all cusp boundaries deterministically", () => {
      const cusps = [
        { date: "2000-01-19", expected: "Capricorn" },
        { date: "2000-01-20", expected: "Aquarius" },
        { date: "2000-02-18", expected: "Aquarius" },
        { date: "2000-02-19", expected: "Pisces" },
        { date: "2000-04-19", expected: "Aries" },
        { date: "2000-04-20", expected: "Taurus" },
        { date: "2000-06-20", expected: "Gemini" },
        { date: "2000-06-21", expected: "Cancer" },
        { date: "2000-09-22", expected: "Virgo" },
        { date: "2000-09-23", expected: "Libra" },
        { date: "2000-11-21", expected: "Scorpio" },
        { date: "2000-11-22", expected: "Sagittarius" },
      ];
      for (const { date, expected } of cusps) {
        expect(getZodiacSign(date).sign).toBe(expected);
      }
    });
  });

  // ─── Invalid input handling ──────────────────────────────
  describe("invalid input", () => {
    it("returns Capricorn fallback for empty string", () => {
      expect(getZodiacSign("").sign).toBe("Capricorn");
    });

    it("returns Capricorn fallback for garbage input", () => {
      expect(getZodiacSign("not-a-date").sign).toBe("Capricorn");
    });

    it("returns Capricorn fallback for month > 12", () => {
      expect(getZodiacSign("2000-13-01").sign).toBe("Capricorn");
    });

    it("returns Capricorn fallback for day 0", () => {
      expect(getZodiacSign("2000-01-00").sign).toBe("Capricorn");
    });

    it("returns Capricorn fallback for day > 31", () => {
      expect(getZodiacSign("2000-01-32").sign).toBe("Capricorn");
    });

    it("always returns an object with sign and emoji", () => {
      const result = getZodiacSign("invalid");
      expect(result).toHaveProperty("sign");
      expect(result).toHaveProperty("emoji");
      expect(typeof result.sign).toBe("string");
      expect(typeof result.emoji).toBe("string");
    });
  });
});
