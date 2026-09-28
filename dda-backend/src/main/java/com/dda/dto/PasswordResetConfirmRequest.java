package com.dda.dto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter; import lombok.Setter;
@Getter @Setter
public class PasswordResetConfirmRequest {
    @NotBlank private String token;
    @NotBlank @Size(min = 8, message = "La contraseña debe tener al menos 8 caracteres")
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?]).{8,}$", message = "La contraseña debe tener mayúscula, minúscula, número y carácter especial")
    private String password;
}
