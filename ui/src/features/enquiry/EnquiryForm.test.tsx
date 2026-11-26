import { vi } from 'vitest';
import { screen } from '@testing-library/react';
import { fail, mockApi, ok, product } from '../../test/mockApi';
import { renderRoute } from '../../test/render';

const p = product('1', { title: 'Classic Backpack' });

async function openEnquiry(extra: Parameters<typeof mockApi>[0] = {}) {
  const fetchMock = mockApi({ 'GET /api/catalogue/products/1': ok({ product: p }), ...extra });
  const view = renderRoute('/product/1');
  await view.user.click(await screen.findByRole('button', { name: /enquire about this product/i }));
  return { ...view, fetchMock };
}

describe('Enquiry', () => {
  it('GIVEN a product WHEN submitting contact details THEN sends the enquiry and shows "Thank you"', async () => {
    const { user, fetchMock } = await openEnquiry({
      'POST /api/enquiries': ok({ status: 'received', reference: 'AB12CD34' }),
    });

    expect(screen.getByLabelText(/name/i)).toHaveFocus();
    await user.type(screen.getByLabelText(/name/i), 'Ada Lovelace');
    await user.type(screen.getByLabelText(/email/i), 'ada@example.com');
    await user.type(screen.getByLabelText(/message/i), 'Is it waterproof?');
    await user.click(screen.getByRole('button', { name: 'Send enquiry' }));

    const thanks = await screen.findByRole('heading', { name: 'Thank you, Ada!' });
    expect(thanks).toHaveFocus();
    expect(screen.getByText('AB12CD34')).toBeInTheDocument();

    const post = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')!;
    expect(JSON.parse(post[1]!.body as string)).toEqual({
      productId: '1',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      message: 'Is it waterproof?',
    });
  });

  it('validates required fields before sending anything', async () => {
    const { user, fetchMock } = await openEnquiry();
    await user.type(screen.getByLabelText(/email/i), 'not-an-email');
    await user.click(screen.getByRole('button', { name: 'Send enquiry' }));

    expect(screen.getByText('Please enter your name')).toBeInTheDocument();
    expect(screen.getByText(/enter a valid email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText(/name/i)).toHaveFocus();
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false);
  });

  it('keeps the form and explains when the enquiry could not be sent', async () => {
    const { user } = await openEnquiry({
      'POST /api/enquiries': fail(503, 'ENQUIRY_NOT_SENT', 'We could not send your enquiry right now. Please try again.'),
    });
    await user.type(screen.getByLabelText(/name/i), 'Ada');
    await user.type(screen.getByLabelText(/email/i), 'ada@example.com');
    await user.click(screen.getByRole('button', { name: 'Send enquiry' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not send your enquiry/i);
    expect(screen.queryByText(/thank you/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toHaveValue('Ada');
  });

  it('shows server-side field errors next to the right field', async () => {
    const { user } = await openEnquiry({
      'POST /api/enquiries': fail(400, 'VALIDATION_ERROR', 'Invalid', [
        { field: 'email', message: 'Email domain not accepted' },
      ]),
    });
    await user.type(screen.getByLabelText(/name/i), 'Ada');
    await user.type(screen.getByLabelText(/email/i), 'ada@example.com');
    await user.click(screen.getByRole('button', { name: 'Send enquiry' }));

    expect(await screen.findByText('Email domain not accepted')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toHaveAttribute('aria-invalid', 'true');
  });

  it('can be cancelled', async () => {
    const { user } = await openEnquiry();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByRole('button', { name: /enquire about this product/i })).toBeInTheDocument();
  });
});

describe('Enquiry panel', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('opens as a dialog and closes with Escape, returning focus to the trigger', async () => {
    const { user } = await openEnquiry();
    expect(screen.getByRole('dialog', { name: 'Send an enquiry' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enquire about this product/i })).toHaveFocus();
  });

  it('links to the exact email in the demo inbox when configured', async () => {
    vi.stubEnv('VITE_DEMO_INBOX_URL', 'http://localhost:8025');
    const { user } = await openEnquiry({ 'POST /api/enquiries': ok({ status: 'received', reference: 'AB12CD34' }) });
    await user.type(screen.getByLabelText(/name/i), 'Ada');
    await user.type(screen.getByLabelText(/email/i), 'ada@example.com');
    await user.click(screen.getByRole('button', { name: 'Send enquiry' }));

    const link = await screen.findByRole('link', { name: /view the email sent to sales/i });
    expect(link).toHaveAttribute('href', 'http://localhost:8025/search?q=AB12CD34');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('hides demo inbox links when not configured (production)', async () => {
    vi.stubEnv('VITE_DEMO_INBOX_URL', '');
    const { user } = await openEnquiry({ 'POST /api/enquiries': ok({ status: 'received', reference: 'AB12CD34' }) });
    await user.type(screen.getByLabelText(/name/i), 'Ada');
    await user.type(screen.getByLabelText(/email/i), 'ada@example.com');
    await user.click(screen.getByRole('button', { name: 'Send enquiry' }));
    await screen.findByRole('heading', { name: 'Thank you, Ada!' });
    expect(screen.queryByRole('link', { name: /view the email/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /inbox/i })).not.toBeInTheDocument();
  });
});
