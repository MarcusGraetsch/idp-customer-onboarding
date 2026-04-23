package k8s

import (
	"context"
	"fmt"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
)

// Client ist ein Wrapper für den Kubernetes Client
type Client struct {
	clientset *kubernetes.Clientset
}

// NewClient erstellt einen neuen K8s Client
func NewClient() (*Client, error) {
	config, err := rest.InClusterConfig()
	if err != nil {
		// Nicht im Cluster, versuche kubeconfig
		config, err = clientcmd.NewNonInteractiveDeferredLoadingClientConfig(
			clientcmd.NewDefaultClientConfigLoadingRules(),
			&clientcmd.ConfigOverrides{},
		).ClientConfig()
		if err != nil {
			return nil, fmt.Errorf("keine kubernetes konfiguration gefunden: %w", err)
		}
	}

	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		return nil, fmt.Errorf("kubernetes client erstellen fehlgeschlagen: %w", err)
	}

	return &Client{clientset: clientset}, nil
}

// CreateNamespace erstellt einen Namespace für einen Tenant
func (c *Client) CreateNamespace(ctx context.Context, name, tenantName string) error {
	ns := &corev1.Namespace{
		ObjectMeta: metav1.ObjectMeta{
			Name: name,
			Labels: map[string]string{
				"managed-by":    "idp-platform",
				"tenant":        tenantName,
				"isolation":     "tenant",
			},
		},
	}

	_, err := c.clientset.CoreV1().Namespaces().Create(ctx, ns, metav1.CreateOptions{})
	if err != nil {
		return fmt.Errorf("namespace erstellen fehlgeschlagen: %w", err)
	}

	return nil
}

// NamespaceExists prüft ob ein Namespace existiert
func (c *Client) NamespaceExists(ctx context.Context, name string) (bool, error) {
	_, err := c.clientset.CoreV1().Namespaces().Get(ctx, name, metav1.GetOptions{})
	if err != nil {
		return false, nil // Namespace existiert nicht
	}
	return true, nil
}
