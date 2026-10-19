// Explicit typography for legacy formulas that cannot be parsed safely by the
// Unicode converter. These are display equivalents, never new model equations.
export const formulaOverrides={
 resonance:{latex:String.raw`A=\frac{F_0}{\sqrt{(\omega_0^2-\omega^2)^2+(2\beta\omega)^2}}`},
 ac:{latex:String.raw`u=U_0\cos(2\pi ft+\varphi);\quad U_{\mathrm{RMS}}=\frac{U_0}{\sqrt{2}}`},
 resonance_power:{latex:String.raw`\overline P=\frac12 b\omega^2 A^2;\quad A=\frac{F_0}{\sqrt{(k-m\omega^2)^2+b^2\omega^2}}`},
 debroglie:{latex:String.raw`\lambda=\frac{h}{\sqrt{2meU}}`},
 collision_spring:{latex:String.raw`x_{\max}=\frac{mu}{\sqrt{k(m+M)}}`},
 torsion_pendulum:{latex:String.raw`I\ddot\theta+\kappa\theta=0;\quad T=2\pi\sqrt{\frac I\kappa}`},
 charged_disk:{latex:String.raw`E=\frac{\sigma}{2\varepsilon_0}\left(1-\frac{z}{\sqrt{z^2+a^2}}\right)`},
 rlc_free:{latex:String.raw`L\ddot q+R\dot q+\frac qC=0;\quad \alpha=\frac R{2L},\quad\omega_0=\frac1{\sqrt{LC}}`},
 electron_bragg:{latex:String.raw`\lambda=\frac{hc}{\sqrt{K(K+2m_e c^2)}};\quad 2d\sin\theta=n\lambda`},
 newton_cradle:{latex:String.raw`n_{\text{ra}}=n_{\text{vào}};\quad v_{\text{ra}}=v_{\text{vào}}\quad\text{(lí tưởng)}`,text:'n_ra = n_vào; v_ra = v_vào (giới hạn lí tưởng)'}
};
