package com.Portbil.portfolio_backend.service;

import com.Portbil.portfolio_backend.entity.Project;
import com.Portbil.portfolio_backend.entity.User;
import com.Portbil.portfolio_backend.repository.ProjectRepository;
import com.Portbil.portfolio_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final PortfolioService portfolioService;

    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }

    public List<Project> getProjectsByUserId(String userId) {
        return projectRepository.findByUserId(userId);
    }

    public Optional<Project> getProjectById(String id) {
        return projectRepository.findById(id);
    }

    public Optional<Project> createProject(Project project) {
        Optional<User> user = userRepository.findById(project.getUserId());
        if (user.isEmpty()) {
            return Optional.empty();
        }

        Project savedProject = projectRepository.save(project);
        user.get().getProjectIds().add(savedProject.getId());
        userRepository.save(user.get());
        portfolioService.updatePortfolioWithUserData(user.get().getId());

        return Optional.of(savedProject);
    }

    public Optional<Project> updateProject(String id, Project updatedProject) {
        return projectRepository.findById(id).map(existingProject -> {
            existingProject.setTitle(updatedProject.getTitle());
            existingProject.setDescription(updatedProject.getDescription());
            existingProject.setRepositoryUrl(updatedProject.getRepositoryUrl() != null ? updatedProject.getRepositoryUrl() : updatedProject.getRepository());
            existingProject.setLiveDemoUrl(updatedProject.getLiveDemoUrl() != null ? updatedProject.getLiveDemoUrl() : updatedProject.getLink());
            existingProject.setStartDate(updatedProject.getStartDate());
            existingProject.setEndDate(updatedProject.getEndDate());
            existingProject.setCurrentlyWorkingOn(updatedProject.isCurrentlyWorkingOn());
            existingProject.setTechnologies(updatedProject.getTechnologies());
            existingProject.setPublic(updatedProject.isPublic());
            return projectRepository.save(existingProject);
        });
    }

    public void deleteProject(String id) {
        projectRepository.findById(id).ifPresent(project -> {
            Optional<User> userOptional = userRepository.findById(project.getUserId());
            userOptional.ifPresent(user -> {
                // Vérifier que getProjectIds() retourne une liste et l'initialiser si null
                if (user.getProjectIds() != null) {
                    user.getProjectIds().remove(id);
                } else {
                    user.setProjectIds(new ArrayList<>());
                }
                userRepository.save(user);
                portfolioService.updatePortfolioWithUserData(user.getId()); // Correction : getId() au lieu de get().getId()
            });

            projectRepository.deleteById(id);
        });
    }
}