package com.Portbil.portfolio_backend.service;

import com.Portbil.portfolio_backend.entity.Project;
import com.Portbil.portfolio_backend.entity.User;
import com.Portbil.portfolio_backend.repository.ProjectRepository;
import com.Portbil.portfolio_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository; // ✅ Vérifier l'existence de l'utilisateur
    private final PortfolioService portfolioService; // ✅ Assurer la mise à jour du portfolio

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
        // ✅ Vérifier si l'utilisateur existe avant d'ajouter le projet
        Optional<User> user = userRepository.findById(project.getUserId());
        if (user.isEmpty()) {
            return Optional.empty();
        }

        Project savedProject = projectRepository.save(project);

        // ✅ Ajouter l'ID du projet à l'utilisateur et mettre à jour le portfolio
        user.get().getProjectIds().add(savedProject.getId());
        userRepository.save(user.get());
        portfolioService.updatePortfolioWithUserData(user.get().getId());

        return Optional.of(savedProject);
    }

    public Optional<Project> updateProject(String id, Project updatedProject) {
        return projectRepository.findById(id).map(existingProject -> {
            existingProject.setTitle(updatedProject.getTitle());
            existingProject.setDescription(updatedProject.getDescription());
            existingProject.setRepositoryUrl(updatedProject.getRepositoryUrl() != null ? updatedProject.getRepositoryUrl() : updatedProject.getRepository()); // Mapper repository si repositoryUrl est absent
            existingProject.setLiveDemoUrl(updatedProject.getLiveDemoUrl() != null ? updatedProject.getLiveDemoUrl() : updatedProject.getLink());
            existingProject.setStartDate(updatedProject.getStartDate());
            existingProject.setEndDate(updatedProject.getEndDate());
            existingProject.setCurrentlyWorkingOn(updatedProject.isCurrentlyWorkingOn());
            existingProject.setTechnologies(updatedProject.getTechnologies());

            return projectRepository.save(existingProject);
        });
    }

    public void deleteProject(String id) {
        projectRepository.findById(id).ifPresent(project -> {
            // ✅ Supprimer l'ID du projet dans l'utilisateur
            userRepository.findById(project.getUserId()).ifPresent(user -> {
                user.getProjectIds().remove(id);
                userRepository.save(user);
                portfolioService.updatePortfolioWithUserData(user.getId());
            });

            projectRepository.deleteById(id);
        });
    }
}
