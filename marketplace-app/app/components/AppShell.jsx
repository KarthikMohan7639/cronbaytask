"use client";
import { PlusOutlined } from '@ant-design/icons';
import 'antd/dist/reset.css';
import Button from 'antd/es/button';
import Layout from 'antd/es/layout';
import Menu from 'antd/es/menu';
import Typography from 'antd/es/typography';
import Link from 'next/link';

const { Header, Content, Footer } = Layout;

export default function AppShell({ children }) {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ position: 'sticky', top: 0, zIndex: 100, width: '100%' }}>
        <div className="logo">
          <Link href="/" style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>
            Job Marketplace
          </Link>
        </div>
        <Menu
          theme="dark"
          mode="horizontal"
          items={[
            { key: 'home', label: <Link href="/">Home</Link> },
            {
              key: 'new',
              label: (
                <Link href="/new">
                  <Button type="primary" icon={<PlusOutlined />} size="small">
                    New Job
                  </Button>
                </Link>
              ),
            },
          ]}
        />
      </Header>
      <Content style={{ padding: '24px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        {children}
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        <Typography.Text type="secondary">© {new Date().getFullYear()} Job Marketplace</Typography.Text>
      </Footer>
    </Layout>
  );
}
