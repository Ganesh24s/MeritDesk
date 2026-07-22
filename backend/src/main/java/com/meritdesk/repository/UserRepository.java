package com.meritdesk.repository;

import com.meritdesk.entity.User;
import com.meritdesk.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.department WHERE u.id = :id")
    Optional<User> findByIdWithDepartment(@Param("id") Long id);

    boolean existsByEmail(String email);

    List<User> findByCompanyIdAndRole(Long companyId, Role role);

    List<User> findByCompanyId(Long companyId);

    List<User> findByCompanyIdAndRoleIn(Long companyId, List<Role> roles);

    List<User> findByDepartmentId(Long departmentId);

    List<User> findByDepartmentIdAndRoleIn(Long departmentId, List<Role> roles);

    @Query("SELECT u FROM User u WHERE u.company.id = :companyId AND u.role IN :roles AND u.active = true")
    List<User> findActiveByCompanyIdAndRoles(@Param("companyId") Long companyId, @Param("roles") List<Role> roles);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.skills WHERE u.department.id = :deptId AND u.role IN ('EMPLOYEE', 'DEPARTMENT_ADMIN') AND u.active = true AND u.available = true")
    List<User> findAvailableEmployeesByDepartment(@Param("deptId") Long deptId);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.skills WHERE u.company.id = :companyId AND u.role IN ('EMPLOYEE', 'DEPARTMENT_ADMIN') AND u.active = true AND u.available = true")
    List<User> findAvailableEmployeesByCompany(@Param("companyId") Long companyId);

    long countByCompanyId(Long companyId);

    long countByCompanyIdAndRole(Long companyId, Role role);

    @Query("SELECT u FROM User u WHERE u.company.id = :companyId AND u.role IN ('EMPLOYEE', 'DEPARTMENT_ADMIN') ORDER BY u.honourScore DESC")
    List<User> findEmployeesByCompanyOrderByHonour(@Param("companyId") Long companyId);

    @Query("SELECT COUNT(u) FROM User u JOIN u.skills s WHERE s.id = :skillId AND u.active = true")
    long countEmployeesWithSkill(@Param("skillId") Long skillId);
}
