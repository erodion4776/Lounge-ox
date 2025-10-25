                                            {isAdmin && <td className="px-6 py-4 text-sm text-gray-300">₦{product.cost.toFixed(2)}</td>}
    const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = await api.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Failed to get current user:', error);
        // Don't throw - just set user to null and continue
        setUser(null);
      } finally {
        // Always set loading to false, even if there's an error
        setLoading(false);
      }
    };

    // Add a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.error('Auth initialization timeout');
      setLoading(false);
    }, 5000);

    initAuth().finally(() => clearTimeout(timeout));

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        try {
          const currentUser = await api.getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          console.error('Failed to get user on sign in:', error);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const login = (newUser: User) => {
    setUser(newUser);
  };

  const logout = async () => {
    try {
      await api.signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};                                        <td className="px-6 py-4 text-sm text-gray-300">₦{product.price.toFixed(2)}</td>
                                            {isAdmin && (
                                                <td className={`px-6 py-4 text-sm font-medium ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    ₦{profit.toFixed(2)}
                                                </td>
                                            )}
                                            <td className={`px-6 py-4 text-sm font-medium ${product.stock === 0 ? 'text-red-400' : product.stock < 10 ? 'text-yellow-400' : 'text-gray-300'}`}>
                                                {product.stock}
                                            </td>
                                            {isAdmin && (
                                                <td className="px-6 py-4 text-right text-sm space-x-2">
                                                    <button onClick={() => handleEdit(product)} className="text-amber-400 hover:text-amber-300">Edit</button>
                                                    <button onClick={() => handleDelete(product.id, product.name)} className="text-red-500 hover:text-red-400">Delete</button>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && isAdmin && (
                <ProductForm product={editingProduct} onSave={handleSave} onCancel={() => setIsModalOpen(false)} />
            )}
        </div>
    );
};

export default ProductsPage;
