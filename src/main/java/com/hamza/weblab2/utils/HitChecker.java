package com.hamza.weblab2.utils;

import java.math.BigDecimal;

public class HitChecker {

    public static boolean isHit(BigDecimal x, BigDecimal y, BigDecimal r) {
        // Create a constant for zero to use in comparisons
        BigDecimal zero = BigDecimal.ZERO;

        // 1st Quadrant: Quarter-circle (x^2 + y^2 <= r^2)
        if (x.compareTo(zero) >= 0 && y.compareTo(zero) >= 0) {
            // x.pow(2) is x*x
            BigDecimal xSquared = x.pow(2);
            BigDecimal ySquared = y.pow(2);
            BigDecimal rSquared = r.pow(2);
            // x^2 + y^2
            BigDecimal sumOfSquares = xSquared.add(ySquared);
            // Is (x^2 + y^2) <= r^2 ?
            return sumOfSquares.compareTo(rSquared) <= 0;
        }

        // 2nd Quadrant: Rectangle (x >= -r and y <= r/2)
        if (x.compareTo(zero) <= 0 && y.compareTo(zero) >= 0) {
            BigDecimal negativeR = r.negate();
            BigDecimal rHalf = r.divide(new BigDecimal("2"));
            // Is x >= -r AND y <= r/2 ?
            return x.compareTo(negativeR) >= 0 && y.compareTo(rHalf) <= 0;
        }

        // 3rd Quadrant: Triangle (y >= -2x - r)
        if (x.compareTo(zero) <= 0 && y.compareTo(zero) <= 0) {
            // -2 * x
            BigDecimal term = x.multiply(new BigDecimal("-2"));
            // (-2x) - r
            BigDecimal lineValue = term.subtract(r);
            // Is y >= (-2x - r) ?
            return y.compareTo(lineValue) >= 0;
        }

        // 4th Quadrant is empty
        return false;
    }
}