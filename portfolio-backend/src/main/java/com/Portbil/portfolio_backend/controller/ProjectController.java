package com.Portbil.portfolio_backend.controller;

import com.Portbil.portfolio_backend.entity.Project;
import com.Portbil.portfolio_backend.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<Project>> getAllProjects() {
        return ResponseEntity.ok(projectService.getAllProjects());
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("#userId == authentication.name or hasAuthority('ADMIN')")
    public ResponseEntity<List<Project>> getProjectsByUser(@PathVariable String userId) {
        return ResponseEntity.ok(projectService.getProjectsByUserId(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Project> getProjectById(@PathVariable String id) {
        return projectService.getProjectById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("#project.userId == authentication.name or hasAuthority('ADMIN')")
    public ResponseEntity<?> createProject(@RequestBody Project project) {
        Optional<Project> createdProject = projectService.createProject(project);

        if (createdProject.isPresent()) {
            return ResponseEntity.ok(createdProject.get());
        } else {
            return ResponseEntity.badRequest().body("Utilisateur non trouvé, impossible d'ajouter le projet.");
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("@projectService.getProjectById(#id).orElse(null)?.userId == authentication.name or hasAuthority('ADMIN')")
    public ResponseEntity<Project> updateProject(@PathVariable String id, @RequestBody Project project) {
        return projectService.updateProject(id, project)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@projectService.getProjectById(#id).orElse(null)?.userId == authentication.name or hasAuthority('ADMIN')")
    public ResponseEntity<Void> deleteProject(@PathVariable String id) {
        projectService.deleteProject(id);
        return ResponseEntity.noContent().build();
    }
}
