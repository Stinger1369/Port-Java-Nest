package com.Portbil.portfolio_backend.controller;

import com.Portbil.portfolio_backend.entity.Skill;
import com.Portbil.portfolio_backend.service.SkillService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/skills")
@RequiredArgsConstructor
public class SkillController {

    private final SkillService skillService;

    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<Skill>> getAllSkills() {
        return ResponseEntity.ok(skillService.getAllSkills());
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("#userId == authentication.name or hasAuthority('ADMIN')")
    public ResponseEntity<List<Skill>> getSkillsByUser(@PathVariable String userId) {
        return ResponseEntity.ok(skillService.getSkillsByUserId(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Skill> getSkillById(@PathVariable String id) {
        return skillService.getSkillById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("#skill.userId == authentication.name or hasAuthority('ADMIN')")
    public ResponseEntity<Skill> createSkill(@RequestBody Skill skill) {
        try {
            Skill createdSkill = skillService.createSkill(skill);
            return ResponseEntity.ok(createdSkill);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("@skillService.getSkillById(#id).orElse(null)?.userId == authentication.name or hasAuthority('ADMIN')")
    public ResponseEntity<Skill> updateSkill(@PathVariable String id, @RequestBody Skill skill) {
        System.out.println("Updating skill with ID: " + id + ", isPublic: " + skill.isPublic());
        return skillService.updateSkill(id, skill)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@skillService.getSkillById(#id).orElse(null)?.userId == authentication.name or hasAuthority('ADMIN')")
    public ResponseEntity<Void> deleteSkill(@PathVariable String id) {
        skillService.deleteSkill(id);
        return ResponseEntity.noContent().build();
    }
}