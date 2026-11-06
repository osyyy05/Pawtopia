import { useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { CheckCircle2, Download, Home } from 'lucide-react';
import confetti from 'canvas-confetti';
import jsPDF from 'jspdf';

export default function DonationSuccess() {
  const location = useLocation();
  const { amount, shelter, reference, paymentMethod } = location.state || {};

  const paymentMethodLabel = {
    tng: "Touch 'n Go eWallet",
    duitnow: "DuitNow QR",
    credit: "Credit Card",
    debit: "Debit Card",
  };

  // ===== FIREWORK EFFECT =====
  useEffect(() => {
    const duration = 1800;
    const animationEnd = Date.now() + duration;

    const interval = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        window.clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      // LEFT FIREWORK
      confetti({
        particleCount,
        spread: 360,
        startVelocity: 30,
        ticks: 60,
        origin: {
          x: Math.random() * 0.3 + 0.1,
          y: Math.random() * 0.2,
        },
      });

      // RIGHT FIREWORK
      confetti({
        particleCount,
        spread: 360,
        startVelocity: 30,
        ticks: 60,
        origin: {
          x: Math.random() * 0.3 + 0.6,
          y: Math.random() * 0.2,
        },
      });
    }, 250);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const handleDownload = () => {

    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.getWidth();

    // ===== HEADER =====
    doc.setFontSize(18);
    doc.text('PAWTOPIA DONATION RECEIPT', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(11);
    doc.text('Official Transaction Record', pageWidth / 2, 28, { align: 'center' });

    doc.line(15, 32, pageWidth - 15, 32);

    // ===== TABLE CONFIG =====
    const startX = 15;
    const startY = 45;
    const rowHeight = 12;
    const col1Width = 70;
    const col2Width = 120;

    const drawRow = (y: number, label: string, value: string) => {
      // outer border
      doc.rect(startX, y, col1Width + col2Width, rowHeight);

      // vertical divider
      doc.line(startX + col1Width, y, startX + col1Width, y + rowHeight);

      // text (left column)
      doc.setFontSize(11);
      doc.setTextColor(80);
      doc.text(label, startX + 3, y + 8);

      // text (right column)
      doc.setTextColor(0);
      doc.text(value, startX + col1Width + 3, y + 8);
    };

    let y = startY;

    const methodLabel =
      paymentMethodLabel[
        paymentMethod as keyof typeof paymentMethodLabel
      ] ?? 'Not selected';

    // ===== TABLE ROWS =====
    drawRow(y, 'Transaction Reference', reference || '-');
    y += rowHeight;

    drawRow(y, 'Beneficiary', shelter?.name || '-');
    y += rowHeight;

    drawRow(y, 'Date', new Date().toLocaleString());
    y += rowHeight;

    drawRow(y, 'Payment Method', methodLabel);
    y += rowHeight;

    drawRow(y, 'Status', 'SUCCESS');
    y += rowHeight;

    // ===== AMOUNT ROW (highlight style) =====
    y += 5;

    doc.setFillColor(255, 245, 235);
    doc.rect(
      startX,
      y,
      col1Width + col2Width,
      rowHeight,
      'F'
    );

    doc.rect(
      startX,
      y,
      col1Width + col2Width,
      rowHeight
    );

    doc.line(
      startX + col1Width,
      y,
      startX + col1Width,
      y + rowHeight
    );

    doc.setTextColor(0);
    doc.setFontSize(12);

    doc.text(
      'TOTAL AMOUNT',
      startX + 3,
      y + 8
    );

    doc.setTextColor(255, 140, 0);
    doc.setFontSize(14);

    doc.text(
      `RM ${Number(amount).toFixed(2)}`,
      startX + col1Width + 3,
      y + 8
    );

    y += rowHeight + 15;

    // ===== FOOTER BOX =====
    doc.setTextColor(120);
    doc.setFontSize(10);

    doc.rect(
      startX,
      y,
      col1Width + col2Width,
      20
    );

    doc.text(
      'This is a computer-generated receipt and is valid without signature.',
      startX + 3,
      y + 8,
      { maxWidth: 170 }
    );

    doc.text(
      'Thank you for supporting animal welfare ❤️',
      startX + 3,
      y + 15
    );

    // ===== SAVE =====
    doc.save(`Pawtopia_Receipt_${reference}.pdf`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">

      <Card className="max-w-2xl w-full bg-black/60 backdrop-blur-xl border-white/20">
        <CardHeader className="text-center">

          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
          </div>

          <CardTitle className="text-3xl text-white">
            Donation Successful!
          </CardTitle>

          <p className="text-gray-300 mt-2">
            Thank you for your generous contribution
          </p>

        </CardHeader>

        <CardContent className="space-y-6">

          {/* Receipt */}
          <div className="bg-white/5 p-6 rounded-lg border border-white/10 space-y-4">

            <div className="flex justify-between items-center pb-4 border-b border-white/10">
              <span className="text-gray-400">
                Transaction Reference
              </span>

              <span className="text-white font-mono">
                {reference}
              </span>
            </div>

            <div className="flex justify-between items-center pb-4 border-b border-white/10">
              <span className="text-gray-400">
                Beneficiary
              </span>

              <span className="text-white">
                {shelter?.name}
              </span>
            </div>

            <div className="flex justify-between items-center pb-4 border-b border-white/10">
              <span className="text-gray-400">
                Date
              </span>

              <span className="text-white">
                {new Date().toLocaleDateString()}
              </span>
            </div>

            <div className="flex justify-between items-center pb-4 border-b border-white/10">
              <span className="text-gray-400">
                Payment Method
              </span>

              <span className="text-white">
                {paymentMethodLabel[
                  paymentMethod as keyof typeof paymentMethodLabel
                ] || '-'}
              </span>
            </div>

            <div className="flex justify-between items-center">

              <span className="text-gray-400">
                Amount
              </span>

              <span className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                RM {amount?.toFixed(2)}
              </span>

            </div>

          </div>

          {/* Info */}
          <div className="bg-gradient-to-r from-amber-900/30 to-orange-900/30 p-4 rounded-lg border border-amber-500/30">

            <p className="text-sm text-gray-300 text-center">
              A confirmation email has been sent to your registered email address. 
              Your donation will help provide food, medical care, and shelter for animals in need.
            </p>

          </div>

          {/* Actions */}
          <div className="flex gap-4">

            <Button
              onClick={handleDownload}
              variant="outline"
              className="flex-1 border-white/20 text-white hover:bg-white/10"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Receipt
            </Button>

            <Link to="/user/home" className="flex-1">

              <Button className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700">

                <Home className="w-4 h-4 mr-2" />

                Back to Home

              </Button>

            </Link>

          </div>

        </CardContent>

      </Card>

    </div>
  );
}