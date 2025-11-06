package com.hamza.weblab2.model;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.math.BigDecimal;


public class HistoryEntry implements Serializable {
    private BigDecimal x;
    private BigDecimal y;
    private BigDecimal r;
    private boolean hit;
    private String serverTime;
    private double executionTimeMs;

    public HistoryEntry(BigDecimal  x, BigDecimal  y, BigDecimal  r, boolean hit, long executionTimeMs) {
        this.x = x;
        this.y = y;
        this.r = r;
        this.hit = hit;
        this.serverTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        this.executionTimeMs = executionTimeMs /1_000_000.0;
    }

    public BigDecimal  getX() {
        return x;
    }

    public BigDecimal  getY() {
        return y;
    }

    public BigDecimal  getR() {
        return r;
    }

    public boolean isHit() {
        return hit;
    }

    public String getServerTime() {
        return serverTime;
    }

    public double getExecutionTimeMs() {
        return executionTimeMs;
    }
}