package com.Portbil.portfolio_backend.repository;

import com.Portbil.portfolio_backend.entity.Report;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ReportRepository extends MongoRepository<Report, String> {
    List<Report> findByReportedId(String reportedId);
    List<Report> findByStatus(String status);
}