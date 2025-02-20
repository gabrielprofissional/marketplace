import React, { useState } from 'react';

function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        password: '',
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        const url = isLogin ? 'http://localhost:3000/login' : 'http://localhost:3000/register';
        const method = isLogin ? 'POST' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();
            alert(data.message || data.error);

            if (response.ok) {
                setFormData({ email: '', username: '', password: '' });
            }
        } catch (error) {
            console.error('Erro:', error);
        }
    };

    return (
        <div>
            <h2>{isLogin ? 'Login' : 'Registro'}</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Email</label>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                    />
                </div>

                {!isLogin && (
                    <div>
                        <label>Nome de usuário</label>
                        <input
                            type="text"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            required
                        />
                    </div>
                )}

                <div>
                    <label>Senha</label>
                    <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                    />
                </div>

                <button type="submit">{isLogin ? 'Entrar' : 'Registrar'}</button>
            </form>
            <p>
                {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}{' '}
                <span onClick={() => setIsLogin(!isLogin)}>
                    {isLogin ? 'Registre-se' : 'Login'}
                </span>
            </p>
        </div>
    );
}

export default Auth;
